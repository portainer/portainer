package useractivity

import (
	"path"
	"time"

	storm "github.com/asdine/storm/v3"
	"github.com/asdine/storm/v3/q"
	portainer "github.com/portainer/portainer/api"
)

const (
	cleanupInterval = 24 * time.Hour
	maxLogsAge      = 7

	// RedactedValue is used for cleared fields
	RedactedValue = "[REDACTED]"
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

	err = db.Init(&portainer.UserActivityLog{})
	if err != nil {
		return nil, err
	}

	err = db.Init(&portainer.AuthActivityLog{})
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

func (store *Store) getLogs(activities interface{}, activityLogType interface{}, opts portainer.UserActivityLogBaseQuery, matchers []q.Matcher) (int, error) {
	if opts.Limit == 0 {
		opts.Limit = 50
	}

	if opts.SortBy == "" {
		opts.SortBy = "Timestamp"
	}

	matchers = append(matchers, q.Gte("Timestamp", opts.AfterTimestamp))

	if opts.BeforeTimestamp != 0 {
		matchers = append(matchers, q.Lte("Timestamp", opts.BeforeTimestamp))
	}

	query := store.db.Select(matchers...)

	count, err := query.Count(activityLogType)
	if err != nil {
		return 0, err
	}

	if count == 0 {
		return 0, nil
	}

	limitedQuery := query.Limit(opts.Limit).Skip(opts.Offset).OrderBy(opts.SortBy)

	if opts.SortDesc {
		limitedQuery = limitedQuery.Reverse()
	}

	err = limitedQuery.Find(activities)
	if err != nil && err != storm.ErrNotFound {
		return 0, err
	}

	return count, nil
}
