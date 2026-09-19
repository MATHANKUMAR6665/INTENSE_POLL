package database

import (
	"context"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"syncpoll-backend/internal/config"
	"syncpoll-backend/internal/models"
	"syncpoll-backend/pkg/utils"
)

type Database struct {
	MongoClient *mongo.Client
	MongoDB     *mongo.Database
	UsersColl   *mongo.Collection
	PollsColl   *mongo.Collection
	VotesColl   *mongo.Collection

	RedisClient *redis.Client

	// In-memory storage for resilient local development & offline evaluation
	MemMu    sync.RWMutex
	MemUsers map[string]models.User // keyed by email
	MemPolls map[string]models.Poll // keyed by hex ID
	MemVotes map[string][]models.VoteRecord
}

func InitDB(cfg *config.Config) (*Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	dbInstance := &Database{
		MemUsers: make(map[string]models.User),
		MemPolls: make(map[string]models.Poll),
		MemVotes: make(map[string][]models.VoteRecord),
	}

	// 1. Attempt MongoDB connection
	log.Printf("Connecting to MongoDB at: %s ...", cfg.MongoURI)
	mongoOpts := options.Client().ApplyURI(cfg.MongoURI).SetServerSelectionTimeout(2 * time.Second)
	mongoClient, err := mongo.Connect(ctx, mongoOpts)
	if err == nil {
		if pingErr := mongoClient.Ping(ctx, nil); pingErr == nil {
			log.Println("Successfully connected to MongoDB!")
			db := mongoClient.Database(cfg.MongoDBName)
			dbInstance.MongoClient = mongoClient
			dbInstance.MongoDB = db
			dbInstance.UsersColl = db.Collection("users")
			dbInstance.PollsColl = db.Collection("polls")
			dbInstance.VotesColl = db.Collection("votes")

			_, _ = dbInstance.UsersColl.Indexes().CreateOne(ctx, mongo.IndexModel{
				Keys:    bson.D{{Key: "email", Value: 1}},
				Options: options.Index().SetUnique(true),
			})
			_, _ = dbInstance.PollsColl.Indexes().CreateOne(ctx, mongo.IndexModel{
				Keys:    bson.D{{Key: "code", Value: 1}},
				Options: options.Index().SetUnique(true),
			})
		} else {
			log.Printf("Notice: MongoDB ping failed (%v). Running in resilient in-memory mode.", pingErr)
			_ = mongoClient.Disconnect(ctx)
		}
	} else {
		log.Printf("Notice: MongoDB connect failed. Running in resilient in-memory mode.")
	}

	// 2. Attempt Redis connection
	log.Printf("Connecting to Redis at: %s ...", cfg.RedisURI)
	redisOpt, err := redis.ParseURL(cfg.RedisURI)
	var rClient *redis.Client
	if err != nil {
		rClient = redis.NewClient(&redis.Options{
			Addr:        cfg.RedisURI,
			DialTimeout: 2 * time.Second,
		})
	} else {
		rClient = redis.NewClient(redisOpt)
	}

	redisCtx, redisCancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer redisCancel()
	if err := rClient.Ping(redisCtx).Err(); err == nil {
		log.Println("Successfully connected to Redis!")
		dbInstance.RedisClient = rClient
	} else {
		log.Printf("Notice: Redis ping failed (%v). Running in in-memory fallback mode.", err)
		_ = rClient.Close()
	}

	return dbInstance, nil
}

// User operations
func (d *Database) FindUserByEmail(ctx context.Context, email string) (*models.User, error) {
	emailHash := utils.HashForLookup(email)
	if d.UsersColl != nil {
		var user models.User
		err := d.UsersColl.FindOne(ctx, bson.M{
			"$or": []bson.M{
				{"email_hash": emailHash},
				{"email": email},
			},
		}).Decode(&user)
		if err != nil {
			return nil, err
		}
		return &user, nil
	}

	d.MemMu.RLock()
	defer d.MemMu.RUnlock()
	for _, u := range d.MemUsers {
		if u.EmailHash == emailHash || u.Email == email {
			return &u, nil
		}
	}
	return nil, errors.New("user not found")
}

func (d *Database) FindUserByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	if d.UsersColl != nil {
		var user models.User
		err := d.UsersColl.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
		if err != nil {
			return nil, err
		}
		return &user, nil
	}

	d.MemMu.RLock()
	defer d.MemMu.RUnlock()
	for _, u := range d.MemUsers {
		if u.ID == id {
			return &u, nil
		}
	}
	return nil, errors.New("user not found")
}

func (d *Database) CreateUser(ctx context.Context, user models.User) error {
	if user.EmailHash == "" {
		user.EmailHash = utils.HashForLookup(user.Email)
	}

	if d.UsersColl != nil {
		_, err := d.UsersColl.InsertOne(ctx, user)
		return err
	}

	d.MemMu.Lock()
	defer d.MemMu.Unlock()
	for _, u := range d.MemUsers {
		if u.EmailHash == user.EmailHash || u.Email == user.Email {
			return errors.New("email is already registered")
		}
	}
	d.MemUsers[user.EmailHash] = user
	return nil
}

// Poll operations
func (d *Database) CreatePoll(ctx context.Context, poll models.Poll) error {
	if d.PollsColl != nil {
		_, err := d.PollsColl.InsertOne(ctx, poll)
		return err
	}

	d.MemMu.Lock()
	defer d.MemMu.Unlock()
	d.MemPolls[poll.ID.Hex()] = poll
	return nil
}

func (d *Database) FindPollByIDOrCode(ctx context.Context, idOrCode string) (*models.Poll, error) {
	if d.PollsColl != nil {
		var poll models.Poll
		var err error
		if objID, parseErr := primitive.ObjectIDFromHex(idOrCode); parseErr == nil {
			err = d.PollsColl.FindOne(ctx, bson.M{"_id": objID}).Decode(&poll)
		} else {
			err = d.PollsColl.FindOne(ctx, bson.M{"code": idOrCode}).Decode(&poll)
		}
		if err == nil {
			return &poll, nil
		}
	}

	d.MemMu.RLock()
	defer d.MemMu.RUnlock()
	// Lookup by hex ID
	if poll, exists := d.MemPolls[idOrCode]; exists {
		return &poll, nil
	}
	// Lookup by PIN code
	for _, p := range d.MemPolls {
		if p.Code == idOrCode {
			return &p, nil
		}
	}
	return nil, errors.New("poll not found")
}

func (d *Database) ListPollsByCreator(ctx context.Context, creatorID primitive.ObjectID) ([]models.Poll, error) {
	if d.PollsColl != nil {
		findOptions := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
		cursor, err := d.PollsColl.Find(ctx, bson.M{"creator_id": creatorID}, findOptions)
		if err == nil {
			var polls []models.Poll
			_ = cursor.All(ctx, &polls)
			if polls != nil {
				return polls, nil
			}
		}
	}

	d.MemMu.RLock()
	defer d.MemMu.RUnlock()
	var polls []models.Poll
	for _, p := range d.MemPolls {
		if p.CreatorID == creatorID {
			polls = append(polls, p)
		}
	}
	if polls == nil {
		polls = []models.Poll{}
	}
	return polls, nil
}

func (d *Database) UpdatePoll(ctx context.Context, pollID primitive.ObjectID, isActive, showResults *bool) error {
	if d.PollsColl != nil {
		updateFields := bson.M{}
		if isActive != nil {
			updateFields["is_active"] = *isActive
		}
		if showResults != nil {
			updateFields["show_results"] = *showResults
		}
		if len(updateFields) > 0 {
			_, err := d.PollsColl.UpdateOne(ctx, bson.M{"_id": pollID}, bson.M{"$set": updateFields})
			if err == nil {
				return nil
			}
		}
	}

	d.MemMu.Lock()
	defer d.MemMu.Unlock()
	hexID := pollID.Hex()
	if poll, exists := d.MemPolls[hexID]; exists {
		if isActive != nil {
			poll.IsActive = *isActive
		}
		if showResults != nil {
			poll.ShowResults = *showResults
		}
		d.MemPolls[hexID] = poll
		return nil
	}
	return errors.New("poll not found")
}

func (d *Database) DeletePoll(ctx context.Context, pollID primitive.ObjectID) error {
	if d.PollsColl != nil {
		_, err := d.PollsColl.DeleteOne(ctx, bson.M{"_id": pollID})
		if err == nil {
			return nil
		}
	}

	d.MemMu.Lock()
	defer d.MemMu.Unlock()
	delete(d.MemPolls, pollID.Hex())
	return nil
}

func (d *Database) RecordVote(ctx context.Context, vote models.VoteRecord, totalVotes int64) {
	if d.VotesColl != nil {
		_, _ = d.VotesColl.InsertOne(ctx, vote)
		_, _ = d.PollsColl.UpdateOne(ctx, bson.M{"_id": vote.PollID}, bson.M{"$set": bson.M{"total_votes": totalVotes}})
		return
	}

	d.MemMu.Lock()
	defer d.MemMu.Unlock()
	hexID := vote.PollID.Hex()
	d.MemVotes[hexID] = append(d.MemVotes[hexID], vote)
	if poll, exists := d.MemPolls[hexID]; exists {
		poll.TotalVotes = totalVotes
		d.MemPolls[hexID] = poll
	}
}

func (d *Database) GetRecentVoters(ctx context.Context, pollID primitive.ObjectID, limit int) []string {
	names := make([]string, 0)
	if d.VotesColl != nil {
		opts := options.Find().SetSort(bson.D{{Key: "voted_at", Value: -1}}).SetLimit(int64(limit))
		cursor, err := d.VotesColl.Find(ctx, bson.M{"poll_id": pollID}, opts)
		if err == nil {
			var records []models.VoteRecord
			if err := cursor.All(ctx, &records); err == nil {
				for _, r := range records {
					name := r.VoterName
					if name == "" {
						name = "Anonymous"
					}
					names = append(names, name)
				}
				return names
			}
		}
	}

	d.MemMu.RLock()
	defer d.MemMu.RUnlock()
	votes := d.MemVotes[pollID.Hex()]
	count := len(votes)
	for i := count - 1; i >= 0 && len(names) < limit; i-- {
		name := votes[i].VoterName
		if name == "" {
			name = "Anonymous"
		}
		names = append(names, name)
	}
	return names
}

func (d *Database) Close() {
	if d.MongoClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_ = d.MongoClient.Disconnect(ctx)
	}
	if d.RedisClient != nil {
		_ = d.RedisClient.Close()
	}
	fmt.Println("Database connections closed.")
}
