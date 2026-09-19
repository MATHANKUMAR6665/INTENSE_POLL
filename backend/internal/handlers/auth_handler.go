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
	"syncpoll-backend/pkg/utils"
)

type AuthHandler struct {
	cfg *config.Config
	db  *database.Database
}

func NewAuthHandler(cfg *config.Config, db *database.Database) *AuthHandler {
	return &AuthHandler{
		cfg: cfg,
		db:  db,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": utils.FormatValidationError(err)})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if email already registered
	existing, _ := h.db.FindUserByEmail(ctx, req.Email)
	if existing != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email is already registered"})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt credentials"})
		return
	}

	// Encrypt email for secure storage at rest (AES-256-GCM)
	encryptedEmail, err := utils.EncryptData(req.Email, h.cfg.DataEncryptionKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt user data"})
		return
	}
	emailHash := utils.HashForLookup(req.Email)

	newUser := models.User{
		ID:        primitive.NewObjectID(),
		Username:  req.Username,
		Email:     encryptedEmail,
		EmailHash: emailHash,
		Password:  hashedPassword,
		CreatedAt: time.Now(),
	}

	if err := h.db.CreateUser(ctx, newUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user account: " + err.Error()})
		return
	}

	// Generate JWT
	token, err := utils.GenerateToken(newUser.ID.Hex(), newUser.Username, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	returnUser := newUser
	returnUser.Email = req.Email

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  returnUser,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please provide valid email and password"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	user, err := h.db.FindUserByEmail(ctx, req.Email)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := utils.GenerateToken(user.ID.Hex(), user.Username, h.cfg.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to issue session token"})
		return
	}

	returnUser := *user
	if decryptedEmail, err := utils.DecryptData(user.Email, h.cfg.DataEncryptionKey); err == nil {
		returnUser.Email = decryptedEmail
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  returnUser,
	})
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	objID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	user, err := h.db.FindUserByID(ctx, objID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	returnUser := *user
	if decryptedEmail, err := utils.DecryptData(user.Email, h.cfg.DataEncryptionKey); err == nil {
		returnUser.Email = decryptedEmail
	}

	c.JSON(http.StatusOK, returnUser)
}
