package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"syncpoll-backend/internal/config"
	"syncpoll-backend/internal/database"
	"syncpoll-backend/internal/handlers"
	"syncpoll-backend/internal/middleware"
	"syncpoll-backend/internal/services"
	"syncpoll-backend/internal/websocket"
	"syncpoll-backend/pkg/utils"
)

func main() {
	// 1. Load configuration
	cfg := config.LoadConfig()

	// 2. Initialize Database and Redis
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}
	defer db.Close()

	// 3. Initialize Domain Services & WebSocket Hub
	pollService := services.NewPollService(db)
	hub := websocket.NewHub(db, pollService)
	go hub.Run()

	// 4. Initialize HTTP & WS Handlers
	authHandler := handlers.NewAuthHandler(cfg, db)
	pollHandler := handlers.NewPollHandler(db, pollService, hub)
	voteHandler := handlers.NewVoteHandler(cfg, db, pollService)
	wsHandler := handlers.NewWsHandler(hub, db, pollService)

	// 5. Setup Gin Router
	router := gin.Default()
	router.Use(middleware.SetupCORS())
	router.Use(middleware.SecurityHeadersMiddleware())

	// Health Check
	router.GET("/api/health", func(c *gin.Context) {
		mongoStatus := "connected"
		if db.MongoClient == nil {
			mongoStatus = "disconnected"
		}
		redisStatus := "connected"
		if db.RedisClient == nil {
			redisStatus = "disconnected (in-memory mode)"
		}
		c.JSON(http.StatusOK, gin.H{
			"status":   "healthy",
			"service":  "SyncPoll API Engine",
			"mongodb":  mongoStatus,
			"redis":    redisStatus,
			"version":  "1.0.0",
		})
	})

	// Public Auth routes
	authRoutes := router.Group("/api/auth")
	{
		authRoutes.POST("/register", authHandler.Register)
		authRoutes.POST("/login", authHandler.Login)
		authRoutes.GET("/me", middleware.AuthRequired(cfg), authHandler.GetMe)
	}

	// Poll routes
	pollRoutes := router.Group("/api/polls")
	{
		// Public reads
		pollRoutes.GET("/:id", pollHandler.GetPoll)

		// Public voting & reactions
		pollRoutes.POST("/:id/vote", voteHandler.CastVote)
		pollRoutes.POST("/:id/react", voteHandler.SendReaction)

		// Protected Creator actions
		pollRoutes.POST("", middleware.AuthRequired(cfg), pollHandler.CreatePoll)
		pollRoutes.GET("", middleware.AuthRequired(cfg), pollHandler.ListUserPolls)
		pollRoutes.PATCH("/:id/status", middleware.AuthRequired(cfg), pollHandler.UpdatePollStatus)
		pollRoutes.DELETE("/:id", middleware.AuthRequired(cfg), pollHandler.DeletePoll)
	}

	// WebSocket endpoint for real-time live updates
	router.GET("/ws/polls/:id", wsHandler.HandlePollWS)

	if cfg.EnableHTTPS {
		_ = utils.EnsureSelfSignedCert(cfg.TLSCertFile, cfg.TLSKeyFile)
		log.Printf("SyncPoll Backend is live with HTTPS/TLS on port :%s", cfg.Port)
		if err := router.RunTLS(":"+cfg.Port, cfg.TLSCertFile, cfg.TLSKeyFile); err != nil {
			log.Fatalf("Server failed to run with TLS: %v", err)
		}
	} else {
		log.Printf("SyncPoll Backend is live on port :%s", cfg.Port)
		if err := router.Run(":" + cfg.Port); err != nil {
			log.Fatalf("Server failed to run: %v", err)
		}
	}
}
