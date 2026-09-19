package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"sync"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"syncpoll-backend/internal/database"
	"syncpoll-backend/internal/models"
)

type EventMessage struct {
	Type    string      `json:"type"` // "vote", "reaction", "status", "presence"
	Payload interface{} `json:"payload"`
}

type PollService struct {
	db       *database.Database
	// In-memory fallback if Redis is unavailable locally
	memLock       sync.RWMutex
	memOptions    map[string]map[string]int64
	memTotals     map[string]int64
	memVoters     map[string]map[string]bool
	memCoords     map[string][]models.Coordinate
	memSubscribers map[string][]chan EventMessage
}

func NewPollService(db *database.Database) *PollService {
	return &PollService{
		db:             db,
		memOptions:     make(map[string]map[string]int64),
		memTotals:      make(map[string]int64),
		memVoters:      make(map[string]map[string]bool),
		memCoords:      make(map[string][]models.Coordinate),
		memSubscribers: make(map[string][]chan EventMessage),
	}
}

// CheckAndAddVoter checks if voter already voted using Redis SADD (atomic)
func (s *PollService) CheckAndAddVoter(ctx context.Context, pollID, voterHash string) (bool, error) {
	if s.db.RedisClient != nil {
		key := fmt.Sprintf("poll:%s:voters", pollID)
		added, err := s.db.RedisClient.SAdd(ctx, key, voterHash).Result()
		if err == nil {
			return added > 0, nil
		}
		log.Printf("Redis SAdd fallback: %v", err)
	}

	// In-memory fallback
	s.memLock.Lock()
	defer s.memLock.Unlock()
	if _, ok := s.memVoters[pollID]; !ok {
		s.memVoters[pollID] = make(map[string]bool)
	}
	if s.memVoters[pollID][voterHash] {
		return false, nil
	}
	s.memVoters[pollID][voterHash] = true
	return true, nil
}

// RecordOptionVotes atomically increments vote counters in Redis
func (s *PollService) RecordOptionVotes(ctx context.Context, pollID string, optionIDs []string) (map[string]int64, int64, error) {
	var totalVotes int64
	counts := make(map[string]int64)

	if s.db.RedisClient != nil {
		pipe := s.db.RedisClient.Pipeline()
		optKey := fmt.Sprintf("poll:%s:options", pollID)
		totKey := fmt.Sprintf("poll:%s:total", pollID)

		for _, optID := range optionIDs {
			pipe.HIncrBy(ctx, optKey, optID, 1)
		}
		pipe.Incr(ctx, totKey)
		pipe.HGetAll(ctx, optKey)
		pipe.Get(ctx, totKey)

		cmders, err := pipe.Exec(ctx)
		if err == nil {
			// Extract HGetAll
			if hgetAll, ok := cmders[len(cmders)-2].(*redis.MapStringStringCmd); ok {
				for k, v := range hgetAll.Val() {
					c, _ := strconv.ParseInt(v, 10, 64)
					counts[k] = c
				}
			}
			// Extract Total
			if getTot, ok := cmders[len(cmders)-1].(*redis.StringCmd); ok {
				totalVotes, _ = strconv.ParseInt(getTot.Val(), 10, 64)
			}
			return counts, totalVotes, nil
		}
		log.Printf("Redis pipeline fallback: %v", err)
	}

	// In-memory fallback
	s.memLock.Lock()
	defer s.memLock.Unlock()
	if _, ok := s.memOptions[pollID]; !ok {
		s.memOptions[pollID] = make(map[string]int64)
	}
	for _, optID := range optionIDs {
		s.memOptions[pollID][optID]++
	}
	s.memTotals[pollID]++
	totalVotes = s.memTotals[pollID]
	for k, v := range s.memOptions[pollID] {
		counts[k] = v
	}
	return counts, totalVotes, nil
}

// RecordCoordinateVote records 2D spatial coordinate for Heatmap polls
func (s *PollService) RecordCoordinateVote(ctx context.Context, pollID string, coord models.Coordinate) ([]models.Coordinate, int64, error) {
	var totalVotes int64
	var allCoords []models.Coordinate

	if s.db.RedisClient != nil {
		totKey := fmt.Sprintf("poll:%s:total", pollID)
		coordKey := fmt.Sprintf("poll:%s:coords", pollID)

		coordJSON, _ := json.Marshal(coord)
		pipe := s.db.RedisClient.Pipeline()
		pipe.LPush(ctx, coordKey, string(coordJSON))
		pipe.LTrim(ctx, coordKey, 0, 999) // keep recent 1000 coords
		pipe.Incr(ctx, totKey)
		pipe.LRange(ctx, coordKey, 0, -1)
		pipe.Get(ctx, totKey)

		cmders, err := pipe.Exec(ctx)
		if err == nil {
			if lrange, ok := cmders[len(cmders)-2].(*redis.StringSliceCmd); ok {
				for _, str := range lrange.Val() {
					var c models.Coordinate
					if err := json.Unmarshal([]byte(str), &c); err == nil {
						allCoords = append(allCoords, c)
					}
				}
			}
			if getTot, ok := cmders[len(cmders)-1].(*redis.StringCmd); ok {
				totalVotes, _ = strconv.ParseInt(getTot.Val(), 10, 64)
			}
			return allCoords, totalVotes, nil
		}
		log.Printf("Redis coordinate fallback: %v", err)
	}

	// In-memory fallback
	s.memLock.Lock()
	defer s.memLock.Unlock()
	s.memCoords[pollID] = append(s.memCoords[pollID], coord)
	s.memTotals[pollID]++
	totalVotes = s.memTotals[pollID]
	allCoords = append([]models.Coordinate{}, s.memCoords[pollID]...)
	return allCoords, totalVotes, nil
}

// GetLiveState reads current tallies from Redis or in-memory
func (s *PollService) GetLiveState(ctx context.Context, poll *models.Poll) (*models.LivePollState, error) {
	pollID := poll.ID.Hex()
	state := &models.LivePollState{
		PollID:       pollID,
		Code:         poll.Code,
		Type:         poll.Type,
		Title:        poll.Title,
		IsActive:     poll.IsActive,
		ShowResults:  poll.ShowResults,
		OptionCounts: make(map[string]int64),
	}

	// Initialize option keys with 0
	for _, opt := range poll.Options {
		state.OptionCounts[opt.ID] = 0
	}

	if s.db.RedisClient != nil {
		optKey := fmt.Sprintf("poll:%s:options", pollID)
		totKey := fmt.Sprintf("poll:%s:total", pollID)
		coordKey := fmt.Sprintf("poll:%s:coords", pollID)

		if vals, err := s.db.RedisClient.HGetAll(ctx, optKey).Result(); err == nil && len(vals) > 0 {
			for k, v := range vals {
				c, _ := strconv.ParseInt(v, 10, 64)
				state.OptionCounts[k] = c
			}
		}

		if totVal, err := s.db.RedisClient.Get(ctx, totKey).Result(); err == nil {
			tot, _ := strconv.ParseInt(totVal, 10, 64)
			state.TotalVotes = tot
		}

		if coordStrings, err := s.db.RedisClient.LRange(ctx, coordKey, 0, -1).Result(); err == nil {
			for _, str := range coordStrings {
				var c models.Coordinate
				if err := json.Unmarshal([]byte(str), &c); err == nil {
					state.Coordinates = append(state.Coordinates, c)
				}
			}
		}

		return state, nil
	}

	// In-memory fallback
	s.memLock.RLock()
	defer s.memLock.RUnlock()
	state.TotalVotes = s.memTotals[pollID]
	if counts, ok := s.memOptions[pollID]; ok {
		for k, v := range counts {
			state.OptionCounts[k] = v
		}
	}
	if coords, ok := s.memCoords[pollID]; ok {
		state.Coordinates = append([]models.Coordinate{}, coords...)
	}

	return state, nil
}

// PublishLiveEvent distributes event via Redis Pub/Sub channel
func (s *PollService) PublishLiveEvent(ctx context.Context, pollID string, eventType string, payload interface{}) error {
	msg := EventMessage{
		Type:    eventType,
		Payload: payload,
	}
	bytes, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	if s.db.RedisClient != nil {
		channel := fmt.Sprintf("poll:%s:stream", pollID)
		return s.db.RedisClient.Publish(ctx, channel, string(bytes)).Err()
	}

	// In-memory fallback
	s.memLock.RLock()
	defer s.memLock.RUnlock()
	if subs, ok := s.memSubscribers[pollID]; ok {
		for _, ch := range subs {
			select {
			case ch <- msg:
			default:
			}
		}
	}
	return nil
}

// SubscribeLocal adds an in-memory channel listener
func (s *PollService) SubscribeLocal(pollID string) chan EventMessage {
	s.memLock.Lock()
	defer s.memLock.Unlock()
	ch := make(chan EventMessage, 64)
	s.memSubscribers[pollID] = append(s.memSubscribers[pollID], ch)
	return ch
}

// UnsubscribeLocal removes an in-memory listener
func (s *PollService) UnsubscribeLocal(pollID string, ch chan EventMessage) {
	s.memLock.Lock()
	defer s.memLock.Unlock()
	subs := s.memSubscribers[pollID]
	for i, c := range subs {
		if c == ch {
			s.memSubscribers[pollID] = append(subs[:i], subs[i+1:]...)
			close(ch)
			break
		}
	}
}

// SyncPollToMongo durably persists the vote count to MongoDB
func (s *PollService) SyncPollToMongo(ctx context.Context, pollID string, totalVotes int64) {
	if s.db.PollsColl == nil {
		return
	}
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return
	}
	_, err = s.db.PollsColl.UpdateOne(ctx,
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"total_votes": totalVotes}},
	)
	if err != nil {
		log.Printf("Failed to sync poll to Mongo: %v", err)
	}
}
