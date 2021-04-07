package useractivity

import (
	"path"
	"time"

	storm "github.com/asdine/storm/v3"
)

const (
	cleanupInterval = 24 * time.Hour
	maxLogsAge      = 7
)

// Store is a store for user activities
type Store struct {
	db                *dbWrapper
	cleanupStopSignal chan struct{}
}

// dbWrapper wraps the storm db type to make it interchangeable
type dbWrapper struct {
	*storm.DB
}

const databaseFileName = "useractivity.db"

// NewUserActivityStore Creates a new store
func NewUserActivityStore(dataPath string) (*Store, error) {
	databasePath := path.Join(dataPath, databaseFileName)

	db, err := storm.Open(databasePath)
	if err != nil {
		return nil, err
	}

	store := &Store{
		db: &dbWrapper{
			DB: db,
		},
	}

	err = store.startCleanupLoop()
	if err != nil {
		return nil, err
	}

	return store, nil
}

// Close closes the DB
func (store *Store) Close() error {
	store.stopCleanupLoop()

	return store.db.Close()
}
