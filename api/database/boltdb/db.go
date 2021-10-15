package boltdb

import (
	"encoding/binary"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path"
	"time"

	"github.com/boltdb/bolt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/errors"

	"github.com/ghodss/yaml"
	"github.com/konoui/boltdb-exporter/pkg/exporter"
)

const (
	DatabaseFileName = "portainer.db"
)

type DbConnection struct {
	Path        string
	FileService portainer.FileService

	*bolt.DB
}

func (connection *DbConnection) GetDatabaseFilename() string {
	return DatabaseFileName
}

func (connection *DbConnection) GetStorePath() string {
	return connection.Path
}

// Open opens and initializes the BoltDB database.
func (connection *DbConnection) Open() error {
	databaseExportPath := path.Join(connection.Path, fmt.Sprintf("raw-%s-%d.yaml", DatabaseFileName, time.Now().Unix()))
	if err := connection.ExportRaw(databaseExportPath); err != nil {
		log.Printf("raw export to %s error: %s", databaseExportPath, err)
	} else {
		log.Printf("raw export to %s success", databaseExportPath)
	}

	databasePath := path.Join(connection.Path, DatabaseFileName)

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
	databasePath := path.Join(connection.Path, DatabaseFileName)
	if _, err := os.Stat(databasePath); err != nil {
		return fmt.Errorf("stat on %s failed: %s", databasePath, err)
	}

	b, err := exporter.Export(databasePath, yaml.Marshal)
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

	return UnmarshalObject(data, object)
}

// UpdateObject is a generic function used to update an object inside a database database.
func (connection *DbConnection) UpdateObject(bucketName string, key []byte, object interface{}) error {
	return connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))

		data, err := MarshalObject(object)
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
			err := UnmarshalObject(v, &obj)
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

		data, err := MarshalObject(obj)
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

		data, err := MarshalObject(obj)
		if err != nil {
			return err
		}

		return bucket.Put(connection.ConvertToKey(int(id)), data)
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

		data, err := MarshalObject(obj)
		if err != nil {
			return err
		}

		return bucket.Put(connection.ConvertToKey(int(id)), data)
	})
}

func (connection *DbConnection) GetAll(bucketName string, obj interface{}, append func(o interface{}) (interface{}, error)) error {
	err := connection.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			err := UnmarshalObject(v, obj)
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
			err := UnmarshalObjectWithJsoniter(v, obj)
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
