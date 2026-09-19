package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"syncpoll-backend/pkg/utils"
)

type Config struct {
	Port              string
	MongoURI          string
	MongoDBName       string
	RedisURI          string
	JWTSecret         string
	CORSOrigin        string
	DataEncryptionKey []byte
	EnableHTTPS       bool
	TLSCertFile       string
	TLSKeyFile        string
}

func LoadConfig() *Config {
	// Attempt to load .env, ignore error if missing (e.g. in cloud container environments)
	if err := godotenv.Load(); err != nil {
		log.Println("Notice: No .env file found, using system environment variables or defaults")
	}

	encSecret := getEnv("DATA_ENCRYPTION_KEY", "syncpoll_aes_gcm_secret_2026_super_safe_key")

	cfg := &Config{
		Port:              getEnv("PORT", "8080"),
		MongoURI:          getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDBName:       getEnv("MONGO_DB_NAME", "syncpoll"),
		RedisURI:          getEnv("REDIS_URI", "redis://localhost:6379"),
		JWTSecret:         getEnv("JWT_SECRET", "syncpoll_super_secret_jwt_key_guvi_hcl_2026"),
		CORSOrigin:        getEnv("CORS_ORIGIN", "*"),
		DataEncryptionKey: utils.DeriveKey(encSecret),
		EnableHTTPS:       getEnv("ENABLE_HTTPS", "false") == "true",
		TLSCertFile:       getEnv("TLS_CERT_FILE", "../certs/server.crt"),
		TLSKeyFile:        getEnv("TLS_KEY_FILE", "../certs/server.key"),
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
