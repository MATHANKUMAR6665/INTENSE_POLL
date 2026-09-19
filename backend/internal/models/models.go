package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PollType string

const (
	PollTypeChoice PollType = "choice" // Single or multiple choice
	PollTypeMatrix PollType = "matrix" // 2D coordinate heatmap (e.g. Effort vs Impact)
	PollTypeClash  PollType = "clash"  // 2-option head-to-head tug-of-war
)

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username  string             `bson:"username" json:"username" binding:"required,min=3,max=30"`
	Email     string             `bson:"email" json:"email" binding:"required,email"`
	EmailHash string             `bson:"email_hash,omitempty" json:"-"` // SHA-256 blind index for encrypted lookup
	Password  string             `bson:"password" json:"-"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

type PollOption struct {
	ID    string `bson:"id" json:"id"`
	Text  string `bson:"text" json:"text"`
	Color string `bson:"color,omitempty" json:"color,omitempty"`
}

type MatrixConfig struct {
	XAxisLabel string `bson:"x_axis_label" json:"x_axis_label"`
	YAxisLabel string `bson:"y_axis_label" json:"y_axis_label"`
	XMinLabel  string `bson:"x_min_label" json:"x_min_label"`
	XMaxLabel  string `bson:"x_max_label" json:"x_max_label"`
	YMinLabel  string `bson:"y_min_label" json:"y_min_label"`
	YMaxLabel  string `bson:"y_max_label" json:"y_max_label"`
}

type Poll struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Code          string             `bson:"code" json:"code"` // Short 6-char PIN for quick audience join
	CreatorID     primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	CreatorName   string             `bson:"creator_name" json:"creator_name"`
	Title         string             `bson:"title" json:"title" binding:"required,min=2,max=200"`
	Description   string             `bson:"description" json:"description"`
	Type          PollType           `bson:"type" json:"type" binding:"required"`
	Options       []PollOption       `bson:"options" json:"options"`
	MatrixConfig  *MatrixConfig      `bson:"matrix_config,omitempty" json:"matrix_config,omitempty"`
	AllowMultiple bool               `bson:"allow_multiple" json:"allow_multiple"`
	IsActive      bool               `bson:"is_active" json:"is_active"`
	ShowResults   bool               `bson:"show_results" json:"show_results"`
	TotalVotes    int64              `bson:"total_votes" json:"total_votes"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	ExpiresAt     *time.Time         `bson:"expires_at,omitempty" json:"expires_at,omitempty"`
}

type Coordinate struct {
	X float64 `bson:"x" json:"x"`
	Y float64 `bson:"y" json:"y"`
}

type VoteRecord struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PollID      primitive.ObjectID `bson:"poll_id" json:"poll_id"`
	OptionIDs   []string           `bson:"option_ids,omitempty" json:"option_ids,omitempty"`
	Coordinate  *Coordinate        `bson:"coordinate,omitempty" json:"coordinate,omitempty"`
	Fingerprint string             `bson:"fingerprint" json:"fingerprint"`
	IPAddress   string             `bson:"ip_address" json:"ip_address"`
	VoterName   string             `bson:"voter_name,omitempty" json:"voter_name,omitempty"`
	VotedAt     time.Time          `bson:"voted_at" json:"voted_at"`
}

// Request and Response payloads
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=30"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreatePollRequest struct {
	Title         string        `json:"title" binding:"required,min=2,max=200"`
	Description   string        `json:"description"`
	Type          PollType      `json:"type" binding:"required,oneof=choice clash"`
	Options       []string      `json:"options"`
	MatrixConfig  *MatrixConfig `json:"matrix_config,omitempty"`
	AllowMultiple bool          `json:"allow_multiple"`
	ShowResults   bool          `json:"show_results"`
	DurationMins  int           `json:"duration_mins"`
}

type CastVoteRequest struct {
	OptionIDs   []string    `json:"option_ids"`
	Coordinate  *Coordinate `json:"coordinate"`
	Fingerprint string      `json:"fingerprint" binding:"required"`
	VoterName   string      `json:"voter_name,omitempty"`
}

type ReactionRequest struct {
	Emoji string `json:"emoji" binding:"required"`
}

type LivePollState struct {
	PollID        string           `json:"poll_id"`
	Code          string           `json:"code"`
	Type          PollType         `json:"type"`
	Title         string           `json:"title"`
	TotalVotes    int64            `json:"total_votes"`
	OptionCounts  map[string]int64 `json:"option_counts"`
	Coordinates   []Coordinate     `json:"coordinates,omitempty"`
	IsActive      bool             `json:"is_active"`
	ShowResults   bool             `json:"show_results"`
	ActiveViewers int64            `json:"active_viewers"`
	RecentVoters  []string         `json:"recent_voters,omitempty"`
}
