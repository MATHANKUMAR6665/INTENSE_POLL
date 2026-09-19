package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"syncpoll-backend/internal/config"
	"syncpoll-backend/internal/database"
	"syncpoll-backend/internal/models"
	"syncpoll-backend/internal/services"
	"syncpoll-backend/pkg/utils"
)

type VoteHandler struct {
	cfg         *config.Config
	db          *database.Database
	pollService *services.PollService
}

func NewVoteHandler(cfg *config.Config, db *database.Database, pollService *services.PollService) *VoteHandler {
	return &VoteHandler{
		cfg:         cfg,
		db:          db,
		pollService: pollService,
	}
}

func (h *VoteHandler) CastVote(c *gin.Context) {
	pollIDStr := c.Param("id")

	var req models.CastVoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 1. Fetch Poll metadata using DB abstraction
	poll, err := h.db.FindPollByIDOrCode(ctx, pollIDStr)
	if err != nil || poll == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	actualPollID := poll.ID.Hex()

	if !poll.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Voting is currently paused or closed for this poll"})
		return
	}

	if poll.ExpiresAt != nil && time.Now().After(*poll.ExpiresAt) {
		c.JSON(http.StatusForbidden, gin.H{"error": "This poll has expired"})
		return
	}

	// 2. Anti-duplicate voter verification using Redis SADD
	clientIP := utils.GetClientIP(c)
	voterHash := utils.GenerateVoterHash(req.Fingerprint, clientIP)

	isNewVoter, err := h.pollService.CheckAndAddVoter(ctx, actualPollID, voterHash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify vote session"})
		return
	}
	if !isNewVoter {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already voted in this poll!"})
		return
	}

	// 3. Process vote based on type
	var counts map[string]int64
	var coords []models.Coordinate
	var totalVotes int64

	switch poll.Type {
	case models.PollTypeChoice, models.PollTypeClash:
		if len(req.OptionIDs) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Must select at least one option"})
			return
		}
		if !poll.AllowMultiple && len(req.OptionIDs) > 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "This poll only allows selecting a single option"})
			return
		}

		validIDs := make(map[string]bool)
		for _, o := range poll.Options {
			validIDs[o.ID] = true
		}
		for _, selected := range req.OptionIDs {
			if !validIDs[selected] {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid option selected"})
				return
			}
		}

		counts, totalVotes, err = h.pollService.RecordOptionVotes(ctx, actualPollID, req.OptionIDs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record vote counter"})
			return
		}

	case models.PollTypeMatrix:
		if req.Coordinate == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "2D Matrix vote requires coordinate values (X, Y)"})
			return
		}
		if req.Coordinate.X < 0 || req.Coordinate.X > 100 || req.Coordinate.Y < 0 || req.Coordinate.Y > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Coordinates must be between 0 and 100"})
			return
		}

		coords, totalVotes, err = h.pollService.RecordCoordinateVote(ctx, actualPollID, *req.Coordinate)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record coordinate"})
			return
		}
	}

	// 4. Save Encrypted Vote Audit Record to MongoDB / In-memory store (AES-256-GCM)
	encIP, _ := utils.EncryptData(clientIP, h.cfg.DataEncryptionKey)
	encFP, _ := utils.EncryptData(voterHash, h.cfg.DataEncryptionKey)

	voterName := req.VoterName
	if voterName == "" {
		voterName = "Anonymous"
	}

	voteRecord := models.VoteRecord{
		ID:          primitive.NewObjectID(),
		PollID:      poll.ID,
		OptionIDs:   req.OptionIDs,
		Coordinate:  req.Coordinate,
		Fingerprint: encFP,
		IPAddress:   encIP,
		VoterName:   voterName,
		VotedAt:     time.Now(),
	}
	h.db.RecordVote(ctx, voteRecord, totalVotes)

	// 5. Publish real-time live event to Redis Pub/Sub
	eventPayload := gin.H{
		"poll_id":       actualPollID,
		"type":          poll.Type,
		"total_votes":   totalVotes,
		"option_counts": counts,
		"coordinates":   coords,
		"voter_name":    voterName,
	}
	_ = h.pollService.PublishLiveEvent(ctx, actualPollID, "vote_cast", eventPayload)

	c.JSON(http.StatusOK, gin.H{
		"message":     "Vote successfully recorded!",
		"total_votes": totalVotes,
		"state":       eventPayload,
	})
}

func (h *VoteHandler) SendReaction(c *gin.Context) {
	pollIDStr := c.Param("id")

	var req models.ReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Emoji is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	_ = h.pollService.PublishLiveEvent(ctx, pollIDStr, "reaction", gin.H{
		"emoji": req.Emoji,
	})

	c.JSON(http.StatusOK, gin.H{"status": "reaction sent"})
}
