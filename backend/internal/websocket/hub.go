package websocket

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"syncpoll-backend/internal/database"
	"syncpoll-backend/internal/services"
)

type Hub struct {
	db          *database.Database
	pollService *services.PollService

	// Rooms mapped by pollID -> map of clients
	mu        sync.RWMutex
	rooms     map[string]map[*Client]bool
	listeners map[string]context.CancelFunc

	Broadcast  chan BroadcastMessage
	Register   chan *Client
	Unregister chan *Client
}

type BroadcastMessage struct {
	PollID  string
	Message []byte
}

func NewHub(db *database.Database, pollService *services.PollService) *Hub {
	return &Hub{
		db:          db,
		pollService: pollService,
		rooms:       make(map[string]map[*Client]bool),
		listeners:   make(map[string]context.CancelFunc),
		Broadcast:   make(chan BroadcastMessage, 256),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			if _, ok := h.rooms[client.PollID]; !ok {
				h.rooms[client.PollID] = make(map[*Client]bool)
				// Start Redis PubSub or local listener for this poll room
				h.startRoomListener(client.PollID)
			}
			h.rooms[client.PollID][client] = true
			viewerCount := int64(len(h.rooms[client.PollID]))
			h.mu.Unlock()

			// Broadcast presence update
			h.broadcastPresence(client.PollID, viewerCount)

		case client := <-h.Unregister:
			h.mu.Lock()
			if clients, ok := h.rooms[client.PollID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					client.CloseSend()
					viewerCount := int64(len(clients))

					if len(clients) == 0 {
						delete(h.rooms, client.PollID)
						// Cancel Redis listener for this empty room
						if cancel, hasListener := h.listeners[client.PollID]; hasListener {
							cancel()
							delete(h.listeners, client.PollID)
						}
					} else {
						h.mu.Unlock()
						h.broadcastPresence(client.PollID, viewerCount)
						continue
					}
				}
			}
			h.mu.Unlock()

		case bMsg := <-h.Broadcast:
			h.mu.RLock()
			if clients, ok := h.rooms[bMsg.PollID]; ok {
				for client := range clients {
					if !client.SafeSend(bMsg.Message) {
						client.CloseSend()
						delete(clients, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) broadcastPresence(pollID string, viewers int64) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type": "presence",
		"payload": map[string]interface{}{
			"active_viewers": viewers,
		},
	})
	h.Broadcast <- BroadcastMessage{
		PollID:  pollID,
		Message: msg,
	}
}

// startRoomListener starts a Redis Pub/Sub or local channel listener for the poll
func (h *Hub) startRoomListener(pollID string) {
	ctx, cancel := context.WithCancel(context.Background())
	h.listeners[pollID] = cancel

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered in room listener: %v", r)
			}
		}()

		// If Redis is available, subscribe to Redis channel
		if h.db.RedisClient != nil {
			channelName := fmt.Sprintf("poll:%s:stream", pollID)
			pubsub := h.db.RedisClient.Subscribe(ctx, channelName)
			defer pubsub.Close()

			ch := pubsub.Channel()
			for {
				select {
				case <-ctx.Done():
					return
				case msg, ok := <-ch:
					if !ok {
						return
					}
					h.Broadcast <- BroadcastMessage{
						PollID:  pollID,
						Message: []byte(msg.Payload),
					}
				}
			}
		}

		// Fallback to local memory events
		localCh := h.pollService.SubscribeLocal(pollID)
		defer h.pollService.UnsubscribeLocal(pollID, localCh)

		for {
			select {
			case <-ctx.Done():
				return
			case event, ok := <-localCh:
				if !ok {
					return
				}
				bytes, _ := json.Marshal(event)
				h.Broadcast <- BroadcastMessage{
					PollID:  pollID,
					Message: bytes,
				}
			}
		}
	}()
}

// GetActiveViewers returns the count of currently connected WebSocket clients for a poll
func (h *Hub) GetActiveViewers(pollID string) int64 {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if clients, ok := h.rooms[pollID]; ok {
		return int64(len(clients))
	}
	return 0
}
