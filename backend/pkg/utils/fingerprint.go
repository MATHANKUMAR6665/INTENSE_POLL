package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"

	"github.com/gin-gonic/gin"
)

// GenerateVoterHash creates a stable cryptographic hash from client fingerprint and IP
func GenerateVoterHash(fingerprint, ip string) string {
	hasher := sha256.New()
	hasher.Write([]byte(strings.TrimSpace(fingerprint) + ":" + strings.TrimSpace(ip)))
	return hex.EncodeToString(hasher.Sum(nil))
}

// GetClientIP retrieves the real client IP, respecting forward proxies
func GetClientIP(c *gin.Context) string {
	clientIP := c.ClientIP()
	if clientIP == "" {
		clientIP = c.Request.RemoteAddr
	}
	return clientIP
}
