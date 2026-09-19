package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"syncpoll-backend/internal/database"
	"syncpoll-backend/internal/services"
	wsPkg "syncpoll-backend/internal/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type WsHandler struct {
	hub         *wsPkg.Hub
	db          *database.Database
	pollService *services.PollService
}

func NewWsHandler(hub *wsPkg.Hub, db *database.Database, pollService *services.PollService) *WsHandler {
	return &WsHandler{
		hub:         hub,
		db:          db,
		pollService: pollService,
	}
}

func (h *WsHandler) HandlePollWS(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Poll ID is required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade WebSocket: %v", err)
		return
	}

	client := wsPkg.NewClient(h.hub, conn, pollID)

	h.hub.Register <- client

	// Send current initial live state to this client immediately
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		poll, _ := h.db.FindPollByIDOrCode(ctx, pollID)
		if poll != nil {
			liveState, _ := h.pollService.GetLiveState(ctx, poll)
			if liveState != nil {
				liveState.ActiveViewers = h.hub.GetActiveViewers(pollID)
				liveState.RecentVoters = h.db.GetRecentVoters(ctx, poll.ID, 30)
				msgBytes, _ := json.Marshal(map[string]interface{}{
					"type":    "init_state",
					"payload": liveState,
				})
				client.SafeSend(msgBytes)
			}
		}
	}()

	go client.WritePump()
	go client.ReadPump()
}
