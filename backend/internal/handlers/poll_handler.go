package handlers

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"syncpoll-backend/internal/database"
	"syncpoll-backend/internal/models"
	"syncpoll-backend/internal/services"
	"syncpoll-backend/internal/websocket"
	"syncpoll-backend/pkg/utils"
)

type PollHandler struct {
	db          *database.Database
	pollService *services.PollService
	hub         *websocket.Hub
}

func NewPollHandler(db *database.Database, pollService *services.PollService, hub *websocket.Hub) *PollHandler {
	return &PollHandler{
		db:          db,
		pollService: pollService,
		hub:         hub,
	}
}

func generatePollCode() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(900000))
	return fmt.Sprintf("%06d", n.Int64()+100000)
}

func (h *PollHandler) CreatePoll(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	usernameStr, _ := c.Get("username")

	creatorID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid creator ID"})
		return
	}

	var req models.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": utils.FormatValidationError(err)})
		return
	}

	var pollOptions []models.PollOption
	if req.Type == models.PollTypeChoice || req.Type == models.PollTypeClash {
		if len(req.Options) < 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Poll requires at least 2 options"})
			return
		}
		if req.Type == models.PollTypeClash && len(req.Options) != 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Clash poll requires exactly 2 options"})
			return
		}

		palette := []string{"#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"}
		for i, optText := range req.Options {
			color := palette[i%len(palette)]
			pollOptions = append(pollOptions, models.PollOption{
				ID:    uuid.New().String()[:8],
				Text:  optText,
				Color: color,
			})
		}
	} else if req.Type == models.PollTypeMatrix {
		if req.MatrixConfig == nil || req.MatrixConfig.XAxisLabel == "" || req.MatrixConfig.YAxisLabel == "" {
			req.MatrixConfig = &models.MatrixConfig{
				XAxisLabel: "Effort",
				YAxisLabel: "Impact",
				XMinLabel:  "Low Effort",
				XMaxLabel:  "High Effort",
				YMinLabel:  "Low Impact",
				YMaxLabel:  "High Impact",
			}
		}
	}

	var expiresAt *time.Time
	if req.DurationMins > 0 {
		exp := time.Now().Add(time.Duration(req.DurationMins) * time.Minute)
		expiresAt = &exp
	}

	newPoll := models.Poll{
		ID:            primitive.NewObjectID(),
		Code:          generatePollCode(),
		CreatorID:     creatorID,
		CreatorName:   usernameStr.(string),
		Title:         req.Title,
		Description:   req.Description,
		Type:          req.Type,
		Options:       pollOptions,
		MatrixConfig:  req.MatrixConfig,
		AllowMultiple: req.AllowMultiple,
		IsActive:      true,
		ShowResults:   true,
		TotalVotes:    0,
		CreatedAt:     time.Now(),
		ExpiresAt:     expiresAt,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := h.db.CreatePoll(ctx, newPoll); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist poll: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, newPoll)
}

func (h *PollHandler) GetPoll(c *gin.Context) {
	idOrCode := c.Param("id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	poll, err := h.db.FindPollByIDOrCode(ctx, idOrCode)
	if err != nil || poll == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	liveState, _ := h.pollService.GetLiveState(ctx, poll)
	if liveState != nil {
		liveState.ActiveViewers = h.hub.GetActiveViewers(poll.ID.Hex())
		liveState.RecentVoters = h.db.GetRecentVoters(ctx, poll.ID, 10)
	}

	c.JSON(http.StatusOK, gin.H{
		"poll":       poll,
		"live_state": liveState,
	})
}

func (h *PollHandler) ListUserPolls(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	creatorID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid creator ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	polls, err := h.db.ListPollsByCreator(ctx, creatorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query polls"})
		return
	}

	c.JSON(http.StatusOK, polls)
}

type UpdateStatusRequest struct {
	IsActive    *bool `json:"is_active"`
	ShowResults *bool `json:"show_results"`
}

func (h *PollHandler) UpdatePollStatus(c *gin.Context) {
	pollIDStr := c.Param("id")
	pollID, err := primitive.ObjectIDFromHex(pollIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid body"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := h.db.UpdatePoll(ctx, pollID, req.IsActive, req.ShowResults); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update poll: " + err.Error()})
		return
	}

	updateFields := gin.H{}
	if req.IsActive != nil {
		updateFields["is_active"] = *req.IsActive
	}
	if req.ShowResults != nil {
		updateFields["show_results"] = *req.ShowResults
	}

	_ = h.pollService.PublishLiveEvent(ctx, pollIDStr, "status_change", updateFields)

	c.JSON(http.StatusOK, gin.H{"message": "Poll updated successfully", "updates": updateFields})
}

func (h *PollHandler) DeletePoll(c *gin.Context) {
	pollIDStr := c.Param("id")
	pollID, err := primitive.ObjectIDFromHex(pollIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := h.db.DeletePoll(ctx, pollID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete poll"})
		return
	}

	if h.db.RedisClient != nil {
		optKey := fmt.Sprintf("poll:%s:options", pollIDStr)
		totKey := fmt.Sprintf("poll:%s:total", pollIDStr)
		votersKey := fmt.Sprintf("poll:%s:voters", pollIDStr)
		coordKey := fmt.Sprintf("poll:%s:coords", pollIDStr)
		_ = h.db.RedisClient.Del(ctx, optKey, totKey, votersKey, coordKey).Err()
	}

	c.JSON(http.StatusOK, gin.H{"message": "Poll deleted successfully"})
}
