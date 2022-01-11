package boltdb

import (
	"encoding/binary"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path"
	"time"

	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api/dataservices/errors"
	"github.com/sirupsen/logrus"
)

const (
	DatabaseFileName          = "portainer.db"
	EncryptedDatabaseFileName = "portainer.edb"
)

type DbConnection struct {
	Path          string
	EncryptionKey []byte
	isEncrypted   bool

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

// Return true if the database encryption is required
func (connection *DbConnection) DoesStoreNeedEncryption() bool {

	encryptedDbFile := false
	dbFile := path.Join(connection.Path, EncryptedDatabaseFileName)
	if _, err := os.Stat(dbFile); err == nil {
		encryptedDbFile = true
	}

	if encryptedDbFile {
		connection.SetEncrypted(true)
		if connection.EncryptionKey == nil {
			panic("Portainer database is encrypted, but no encryption key was loaded")
		}

		// DB is already encrypted and everything checks out. Nothing to migrate
		return false
	}

	return connection.EncryptionKey != nil
}

// Open opens and initializes the BoltDB database.
func (connection *DbConnection) Open() error {

	logrus.Infof("Loading PortainerDB: %s", connection.GetDatabaseFileName())

	// Now we open the db
	databasePath := connection.GetDatabaseFilePath()
	db, err := bolt.Open(databasePath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return err
	}
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

	b, err := connection.exportJson(databasePath)
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
	return connection.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(bucketName))
		if err != nil {
			return err
		}
		return nil
	})
}

// GetObject is a generic function used to retrieve an unmarshalled object from a database database.
func (connection *DbConnection) GetObject(bucketName string, key []byte, object interface{}) error {
	var data []byte

	err := connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))

		value := bucket.Get(key)
		if value == nil {
			return errors.ErrObjectNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)

		return nil
	})
	if err != nil {
		return err
	}

	return connection.UnmarshalObject(data, object)
}

func (connection *DbConnection) getEncryptionKey() []byte {
	if !connection.isEncrypted {
		return nil
	}

	return connection.EncryptionKey
}

// UpdateObject is a generic function used to update an object inside a database database.
func (connection *DbConnection) UpdateObject(bucketName string, key []byte, object interface{}) error {
	return connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))

		data, err := connection.MarshalObject(object)
		if err != nil {
			return err
		}

		err = bucket.Put(key, data)
		if err != nil {
			return err
		}

		return nil
	})
}

// DeleteObject is a generic function used to delete an object inside a database database.
func (connection *DbConnection) DeleteObject(bucketName string, key []byte) error {
	return connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
		return bucket.Delete(key)
	})
}

// DeleteAllObjects delete all objects where matching() returns (id, ok).
// TODO: think about how to return the error inside (maybe change ok to type err, and use "notfound"?
func (connection *DbConnection) DeleteAllObjects(bucketName string, matching func(o interface{}) (id int, ok bool)) error {
	return connection.Update(func(tx *bolt.Tx) error {
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

	connection.Update(func(tx *bolt.Tx) error {
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
	return connection.Update(func(tx *bolt.Tx) error {
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
	return connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
		data, err := connection.MarshalObject(obj)
		if err != nil {
			return err
		}

		return bucket.Put(connection.ConvertToKey(id), data)
	})
}

// CreateObjectWithSetSequence creates a new object in the bucket, using the specified id, and sets the bucket sequence
// avoid this :)
func (connection *DbConnection) CreateObjectWithSetSequence(bucketName string, id int, obj interface{}) error {
	return connection.Update(func(tx *bolt.Tx) error {
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
