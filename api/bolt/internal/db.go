package internal

import (
	"encoding/binary"

	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api/bolt/errors"
)

type DbConnection struct {
	*bolt.DB
}

// Itob returns an 8-byte big endian representation of v.
// This function is typically used for encoding integer IDs to byte slices
// so that they can be used as BoltDB keys.
func Itob(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	return b
}

// CreateBucket is a generic function used to create a bucket inside a bolt database.
func CreateBucket(connection *DbConnection, bucketName string) error {
	return connection.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(bucketName))
		if err != nil {
			return err
		}
		return nil
	})
}

// GetObject is a generic function used to retrieve an unmarshalled object from a bolt database.
func GetObject(connection *DbConnection, bucketName string, key []byte, object interface{}) error {
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

// UpdateObject is a generic function used to update an object inside a bolt database.
func UpdateObject(connection *DbConnection, bucketName string, key []byte, object interface{}) error {
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

// DeleteObject is a generic function used to delete an object inside a bolt database.
func DeleteObject(connection *DbConnection, bucketName string, key []byte) error {
	return connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucketName))
		return bucket.Delete(key)
	})
}

// GetNextIdentifier is a generic function that returns the specified bucket identifier incremented by 1.
func GetNextIdentifier(connection *DbConnection, bucketName string) int {
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
