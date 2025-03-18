package boltdb

import (
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"path"
	"strconv"
	"time"

	portainer "github.com/portainer/portainer/api"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"

	"github.com/rs/zerolog/log"
	bolt "go.etcd.io/bbolt"
)

const (
	DatabaseFileName          = "portainer.db"
	EncryptedDatabaseFileName = "portainer.edb"
)

var (
	ErrHaveEncryptedAndUnencrypted = errors.New("Portainer has detected both an encrypted and un-encrypted database and cannot start.  Only one database should exist")
	ErrHaveEncryptedWithNoKey      = errors.New("The portainer database is encrypted, but no secret was loaded")
)

type DbConnection struct {
	Path            string
	MaxBatchSize    int
	MaxBatchDelay   time.Duration
	InitialMmapSize int
	EncryptionKey   []byte
	isEncrypted     bool

	*bolt.DB
}

// GetDatabaseFileName get the database filename
func (connection *DbConnection) GetDatabaseFileName() string {
	if connection.IsEncryptedStore() {
		return EncryptedDatabaseFileName
	}

	return DatabaseFileName
}

// GetDataseFilePath get the path + filename for the database file
func (connection *DbConnection) GetDatabaseFilePath() string {
	if connection.IsEncryptedStore() {
		return path.Join(connection.Path, EncryptedDatabaseFileName)
	}

	return path.Join(connection.Path, DatabaseFileName)
}

// GetStorePath get the filename and path for the database file
func (connection *DbConnection) GetStorePath() string {
	return connection.Path
}

func (connection *DbConnection) GetDatabaseFileSize() (int64, error) {
	file, err := os.Stat(connection.GetDatabaseFilePath())
	if err != nil {
		return 0, fmt.Errorf("Failed to stat database file path: %s err: %w", connection.GetDatabaseFilePath(), err)
	}

	return file.Size(), nil
}

func (connection *DbConnection) SetEncrypted(flag bool) {
	connection.isEncrypted = flag
}

// Return true if the database is encrypted
func (connection *DbConnection) IsEncryptedStore() bool {
	return connection.getEncryptionKey() != nil
}

// NeedsEncryptionMigration returns true if database encryption is enabled and
// we have an un-encrypted DB that requires migration to an encrypted DB
func (connection *DbConnection) NeedsEncryptionMigration() (bool, error) {
	// Cases:  Note, we need to check both portainer.db and portainer.edb
	// to determine if it's a new store.   We only need to differentiate between cases 2,3 and 5

	// 1) portainer.edb + key     => False
	// 2) portainer.edb + no key  => ERROR Fatal!
	// 3) portainer.db  + key     => True  (needs migration)
	// 4) portainer.db  + no key  => False
	// 5) NoDB (new)    + key     => False
	// 6) NoDB (new)    + no key  => False
	// 7) portainer.db & portainer.edb => ERROR Fatal!

	// If we have a loaded encryption key, always set encrypted
	if connection.EncryptionKey != nil {
		connection.SetEncrypted(true)
	}

	// Check for portainer.db
	dbFile := path.Join(connection.Path, DatabaseFileName)
	_, err := os.Stat(dbFile)
	haveDbFile := err == nil

	// Check for portainer.edb
	edbFile := path.Join(connection.Path, EncryptedDatabaseFileName)
	_, err = os.Stat(edbFile)
	haveEdbFile := err == nil

	if haveDbFile && haveEdbFile {
		// 7 - encrypted and unencrypted db?
		return false, ErrHaveEncryptedAndUnencrypted
	}

	if haveDbFile && connection.EncryptionKey != nil {
		// 3 - needs migration
		return true, nil
	}

	if haveEdbFile && connection.EncryptionKey == nil {
		// 2 - encrypted db, but no key?
		return false, ErrHaveEncryptedWithNoKey
	}

	// 1, 4, 5, 6
	return false, nil
}

// Open opens and initializes the BoltDB database.
func (connection *DbConnection) Open() error {
	log.Info().Str("filename", connection.GetDatabaseFileName()).Msg("loading PortainerDB")

	// Now we open the db
	databasePath := connection.GetDatabaseFilePath()

	db, err := bolt.Open(databasePath, 0600, &bolt.Options{
		Timeout:         1 * time.Second,
		InitialMmapSize: connection.InitialMmapSize,
	})
	if err != nil {
		return err
	}

	db.MaxBatchSize = connection.MaxBatchSize
	db.MaxBatchDelay = connection.MaxBatchDelay
	connection.DB = db

	return nil
}

// Close closes the BoltDB database.
// Safe to being called multiple times.
func (connection *DbConnection) Close() error {
	log.Info().Msg("closing PortainerDB")

	if connection.DB != nil {
		return connection.DB.Close()
	}

	return nil
}

func (connection *DbConnection) txFn(fn func(portainer.Transaction) error) func(*bolt.Tx) error {
	return func(tx *bolt.Tx) error {
		return fn(&DbTransaction{conn: connection, tx: tx})
	}
}

// UpdateTx executes the given function inside a read-write transaction
func (connection *DbConnection) UpdateTx(fn func(portainer.Transaction) error) error {
	if connection.MaxBatchDelay > 0 && connection.MaxBatchSize > 1 {
		return connection.Batch(connection.txFn(fn))
	}

	return connection.Update(connection.txFn(fn))
}

// ViewTx executes the given function inside a read-only transaction
func (connection *DbConnection) ViewTx(fn func(portainer.Transaction) error) error {
	return connection.View(connection.txFn(fn))
}

// BackupTo backs up db to a provided writer.
// It does hot backup and doesn't block other database reads and writes
func (connection *DbConnection) BackupTo(w io.Writer) error {
	return connection.View(func(tx *bolt.Tx) error {
		_, err := tx.WriteTo(w)

		return err
	})
}

func (connection *DbConnection) ExportRaw(filename string) error {
	databasePath := connection.GetDatabaseFilePath()
	if _, err := os.Stat(databasePath); err != nil {
		return fmt.Errorf("stat on %s failed, error: %w", databasePath, err)
	}

	b, err := connection.ExportJSON(databasePath, true)
	if err != nil {
		return err
	}

	return os.WriteFile(filename, b, 0600)
}

// ConvertToKey returns an 8-byte big endian representation of v.
// This function is typically used for encoding integer IDs to byte slices
// so that they can be used as BoltDB keys.
func (connection *DbConnection) ConvertToKey(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))

	return b
}

// keyToString Converts a key to a string value suitable for logging
func keyToString(b []byte) string {
	if len(b) != 8 {
		return string(b)
	}

	v := binary.BigEndian.Uint64(b)
	if v <= math.MaxInt32 {
		return strconv.FormatUint(v, 10)
	}

	return string(b)
}

// CreateBucket is a generic function used to create a bucket inside a database.
func (connection *DbConnection) SetServiceName(bucketName string) error {
	return connection.UpdateTx(func(tx portainer.Transaction) error {
		return tx.SetServiceName(bucketName)
	})
}

// GetObject is a generic function used to retrieve an unmarshalled object from a database.
func (connection *DbConnection) GetObject(bucketName string, key []byte, object any) error {
	return connection.ViewTx(func(tx portainer.Transaction) error {
		return tx.GetObject(bucketName, key, object)
	})
}

func (connection *DbConnection) GetRawBytes(bucketName string, key []byte) ([]byte, error) {
	var value []byte

	err := connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		value, err = tx.GetRawBytes(bucketName, key)

		return err
	})

	return value, err
}

func (connection *DbConnection) KeyExists(bucketName string, key []byte) (bool, error) {
	var exists bool

	err := connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		exists, err = tx.KeyExists(bucketName, key)

		return err
	})

	return exists, err
}

func (connection *DbConnection) getEncryptionKey() []byte {
	if !connection.isEncrypted {
		return nil
	}

	return connection.EncryptionKey
}

// UpdateObject is a generic function used to update an object inside a database.
func (connection *DbConnection) UpdateObject(bucketName string, key []byte, object any) error {
	return connection.UpdateTx(func(tx portainer.Transaction) error {
		return tx.UpdateObject(bucketName, key, object)
	})
}

// UpdateObjectFunc is a generic function used to update an object safely without race conditions.
func (connection *DbConnection) UpdateObjectFunc(bucketName string, key []byte, object any, updateFn func()) error {
	return connection.Batch(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))

		data := bucket.Get(key)
		if data == nil {
			return fmt.Errorf("%w (bucket=%s, key=%s)", dserrors.ErrObjectNotFound, bucketName, keyToString(key))
		}

		err := connection.UnmarshalObject(data, object)
		if err != nil {
			return err
		}

		updateFn()

		data, err = connection.MarshalObject(object)
		if err != nil {
			return err
		}

		return bucket.Put(key, data)
	})
}

// DeleteObject is a generic function used to delete an object inside a database.
func (connection *DbConnection) DeleteObject(bucketName string, key []byte) error {
	return connection.UpdateTx(func(tx portainer.Transaction) error {
		return tx.DeleteObject(bucketName, key)
	})
}

// DeleteAllObjects delete all objects where matching() returns (id, ok).
// TODO: think about how to return the error inside (maybe change ok to type err, and use "notfound"?
func (connection *DbConnection) DeleteAllObjects(bucketName string, obj any, matching func(o any) (id int, ok bool)) error {
	return connection.UpdateTx(func(tx portainer.Transaction) error {
		return tx.DeleteAllObjects(bucketName, obj, matching)
	})
}

// GetNextIdentifier is a generic function that returns the specified bucket identifier incremented by 1.
func (connection *DbConnection) GetNextIdentifier(bucketName string) int {
	var identifier int

	_ = connection.UpdateTx(func(tx portainer.Transaction) error {
		identifier = tx.GetNextIdentifier(bucketName)
		return nil
	})

	return identifier
}

// CreateObject creates a new object in the bucket, using the next bucket sequence id
func (connection *DbConnection) CreateObject(bucketName string, fn func(uint64) (int, any)) error {
	return connection.UpdateTx(func(tx portainer.Transaction) error {
		return tx.CreateObject(bucketName, fn)
	})
}

// CreateObjectWithId creates a new object in the bucket, using the specified id
func (connection *DbConnection) CreateObjectWithId(bucketName string, id int, obj any) error {
	return connection.UpdateTx(func(tx portainer.Transaction) error {
		return tx.CreateObjectWithId(bucketName, id, obj)
	})
}

// CreateObjectWithStringId creates a new object in the bucket, using the specified id
func (connection *DbConnection) CreateObjectWithStringId(bucketName string, id []byte, obj any) error {
	return connection.UpdateTx(func(tx portainer.Transaction) error {
		return tx.CreateObjectWithStringId(bucketName, id, obj)
	})
}

func (connection *DbConnection) GetAll(bucketName string, obj any, appendFn func(o any) (any, error)) error {
	return connection.ViewTx(func(tx portainer.Transaction) error {
		return tx.GetAll(bucketName, obj, appendFn)
	})
}

func (connection *DbConnection) GetAllWithKeyPrefix(bucketName string, keyPrefix []byte, obj any, appendFn func(o any) (any, error)) error {
	return connection.ViewTx(func(tx portainer.Transaction) error {
		return tx.GetAllWithKeyPrefix(bucketName, keyPrefix, obj, appendFn)
	})
}

// BackupMetadata will return a copy of the boltdb sequence numbers for all buckets.
func (connection *DbConnection) BackupMetadata() (map[string]any, error) {
	buckets := map[string]any{}

	err := connection.View(func(tx *bolt.Tx) error {
		return tx.ForEach(func(name []byte, bucket *bolt.Bucket) error {
			bucketName := string(name)
			seqId := bucket.Sequence()
			buckets[bucketName] = int(seqId)

			return nil
		})
	})

	return buckets, err
}

// RestoreMetadata will restore the boltdb sequence numbers for all buckets.
func (connection *DbConnection) RestoreMetadata(s map[string]any) error {
	var err error

	for bucketName, v := range s {
		id, ok := v.(float64) // JSON ints are unmarshalled to interface as float64. See: https://pkg.go.dev/encoding/json#Decoder.Decode
		if !ok {
			log.Error().Str("bucket", bucketName).Msg("failed to restore metadata to bucket, skipped")

			continue
		}

		err = connection.Batch(func(tx *bolt.Tx) error {
			bucket, err := tx.CreateBucketIfNotExists([]byte(bucketName))
			if err != nil {
				return err
			}

			return bucket.SetSequence(uint64(id))
		})
	}

	return err
}
