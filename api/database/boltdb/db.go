package boltdb

import (
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path"
	"time"

	dserrors "github.com/portainer/portainer/api/dataservices/errors"
	"github.com/sirupsen/logrus"
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

	logrus.Infof("Loading PortainerDB: %s", connection.GetDatabaseFileName())

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
	if connection.DB != nil {
		return connection.DB.Close()
	}
	return nil
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
		return fmt.Errorf("stat on %s failed: %s", databasePath, err)
	}

	b, err := connection.ExportJson(databasePath, true)
	if err != nil {
		return err
	}
	return ioutil.WriteFile(filename, b, 0600)
}

// ConvertToKey returns an 8-byte big endian representation of v.
// This function is typically used for encoding integer IDs to byte slices
// so that they can be used as BoltDB keys.
func (connection *DbConnection) ConvertToKey(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	return b
}

// CreateBucket is a generic function used to create a bucket inside a database database.
func (connection *DbConnection) SetServiceName(bucketName string) error {
	return connection.Batch(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(bucketName))
		return err
	})
}

// GetObject is a generic function used to retrieve an unmarshalled object from a database database.
func (connection *DbConnection) GetObject(bucketName string, key []byte, object interface{}) error {
	var data []byte

	err := connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))

		value := bucket.Get(key)
		if value == nil {
			return dserrors.ErrObjectNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)

		return nil
	})
	if err != nil {
		return err
	}

	return connection.UnmarshalObjectWithJsoniter(data, object)
}

func (connection *DbConnection) getEncryptionKey() []byte {
	if !connection.isEncrypted {
		return nil
	}

	return connection.EncryptionKey
}

// UpdateObject is a generic function used to update an object inside a database database.
func (connection *DbConnection) UpdateObject(bucketName string, key []byte, object interface{}) error {
	data, err := connection.MarshalObject(object)
	if err != nil {
		return err
	}

	return connection.Batch(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
		return bucket.Put(key, data)
	})
}

// DeleteObject is a generic function used to delete an object inside a database database.
func (connection *DbConnection) DeleteObject(bucketName string, key []byte) error {
	return connection.Batch(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
		return bucket.Delete(key)
	})
}

// DeleteAllObjects delete all objects where matching() returns (id, ok).
// TODO: think about how to return the error inside (maybe change ok to type err, and use "notfound"?
func (connection *DbConnection) DeleteAllObjects(bucketName string, matching func(o interface{}) (id int, ok bool)) error {
	return connection.Batch(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var obj interface{}
			err := connection.UnmarshalObject(v, &obj)
			if err != nil {
				return err
			}

			if id, ok := matching(obj); ok {
				err := bucket.Delete(connection.ConvertToKey(id))
				if err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// GetNextIdentifier is a generic function that returns the specified bucket identifier incremented by 1.
func (connection *DbConnection) GetNextIdentifier(bucketName string) int {
	var identifier int

	connection.Batch(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
		id, err := bucket.NextSequence()
		if err != nil {
			return err
		}
		identifier = int(id)
		return nil
	})

	return identifier
}

// CreateObject creates a new object in the bucket, using the next bucket sequence id
func (connection *DbConnection) CreateObject(bucketName string, fn func(uint64) (int, interface{})) error {
	return connection.Batch(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))

		seqId, _ := bucket.NextSequence()
		id, obj := fn(seqId)

		data, err := connection.MarshalObject(obj)
		if err != nil {
			return err
		}

		return bucket.Put(connection.ConvertToKey(int(id)), data)
	})
}

// CreateObjectWithId creates a new object in the bucket, using the specified id
func (connection *DbConnection) CreateObjectWithId(bucketName string, id int, obj interface{}) error {
	return connection.Batch(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
		data, err := connection.MarshalObject(obj)
		if err != nil {
			return err
		}

		return bucket.Put(connection.ConvertToKey(id), data)
	})
}

// CreateObjectWithStringId creates a new object in the bucket, using the specified id
func (connection *DbConnection) CreateObjectWithStringId(bucketName string, id []byte, obj interface{}) error {
	return connection.Batch(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
		data, err := connection.MarshalObject(obj)
		if err != nil {
			return err
		}

		return bucket.Put(id, data)
	})
}

// CreateObjectWithSetSequence creates a new object in the bucket, using the specified id, and sets the bucket sequence
// avoid this :)
func (connection *DbConnection) CreateObjectWithSetSequence(bucketName string, id int, obj interface{}) error {
	return connection.Batch(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))

		// We manually manage sequences for schedules
		err := bucket.SetSequence(uint64(id))
		if err != nil {
			return err
		}

		data, err := connection.MarshalObject(obj)
		if err != nil {
			return err
		}

		return bucket.Put(connection.ConvertToKey(id), data)
	})
}

func (connection *DbConnection) GetAll(bucketName string, obj interface{}, append func(o interface{}) (interface{}, error)) error {
	err := connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			err := connection.UnmarshalObject(v, obj)
			if err != nil {
				return err
			}
			obj, err = append(obj)
			if err != nil {
				return err
			}
		}

		return nil
	})
	return err
}

// TODO: decide which Unmarshal to use, and use one...
func (connection *DbConnection) GetAllWithJsoniter(bucketName string, obj interface{}, append func(o interface{}) (interface{}, error)) error {
	err := connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			err := connection.UnmarshalObjectWithJsoniter(v, obj)
			if err != nil {
				return err
			}
			obj, err = append(obj)
			if err != nil {
				return err
			}
		}

		return nil
	})
	return err
}

func (connection *DbConnection) BackupMetadata() (map[string]interface{}, error) {
	buckets := map[string]interface{}{}

	err := connection.View(func(tx *bolt.Tx) error {
		err := tx.ForEach(func(name []byte, bucket *bolt.Bucket) error {
			bucketName := string(name)
			bucket = tx.Bucket([]byte(bucketName))
			seqId := bucket.Sequence()
			buckets[bucketName] = int(seqId)
			return nil
		})

		return err
	})

	return buckets, err
}

func (connection *DbConnection) RestoreMetadata(s map[string]interface{}) error {
	var err error

	for bucketName, v := range s {
		id, ok := v.(float64) // JSON ints are unmarshalled to interface as float64. See: https://pkg.go.dev/encoding/json#Decoder.Decode
		if !ok {
			logrus.Errorf("Failed to restore metadata to bucket %s, skipped", bucketName)
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
