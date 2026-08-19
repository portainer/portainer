package libprometheus

import (
	"errors"
	"fmt"
	"os"
	"time"

	prometheusreg "github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/prometheus/tsdb"
)

// TSDBConfig holds the options needed to open a Prometheus TSDB.
type TSDBConfig struct {
	DataDir           string
	RetentionDuration time.Duration
	NoLockfile        bool
	Registry          prometheusreg.Registerer
}

// OpenTSDB opens a Prometheus TSDB with the given configuration.
func OpenTSDB(cfg TSDBConfig) (*tsdb.DB, error) {
	return tsdb.Open(cfg.DataDir, NewZerologSlogger(), cfg.Registry, &tsdb.Options{
		RetentionDuration: cfg.RetentionDuration.Milliseconds(),
		NoLockfile:        cfg.NoLockfile,
	}, nil)
}

// InMemoryDB wraps a *tsdb.DB opened in a temporary directory.
// On Close the temp directory is removed, making the storage ephemeral —
// data does not survive process restarts.
type InMemoryDB struct {
	*tsdb.DB
	tmpDir string
}

// Close closes the underlying TSDB and removes the temporary directory.
func (db *InMemoryDB) Close() error {
	return errors.Join(db.DB.Close(), os.RemoveAll(db.tmpDir))
}

// inMemoryTSDBRetention is the retention window for the ephemeral edge evaluator
// TSDB. Slightly over one hour so a full hour of samples is always queryable
// without samples expiring exactly at the evaluation boundary.
const inMemoryTSDBRetention = 65 * time.Minute

// NewInMemoryTSDB opens an ephemeral Prometheus TSDB backed by a temp directory.
// On Linux edge devices /tmp is typically tmpfs, so scrape data stays in RAM.
// Use this for the edge evaluator where crash-recovery of scrape data is not needed.
func NewInMemoryTSDB(reg prometheusreg.Registerer) (*InMemoryDB, error) {
	dir, err := os.MkdirTemp("", "portainer-eval-tsdb-*")
	if err != nil {
		return nil, fmt.Errorf("create in-memory TSDB dir: %w", err)
	}

	db, err := tsdb.Open(dir, NewZerologSlogger(), reg, &tsdb.Options{
		RetentionDuration: inMemoryTSDBRetention.Milliseconds(),
		NoLockfile:        true,
	}, nil)
	if err != nil {
		return nil, errors.Join(fmt.Errorf("open in-memory TSDB: %w", err), os.RemoveAll(dir))
	}

	return &InMemoryDB{DB: db, tmpDir: dir}, nil
}
