package boltdb

import (
	"bytes"

	dserrors "github.com/portainer/portainer/api/dataservices/errors"

	"github.com/rs/zerolog/log"
	bolt "go.etcd.io/bbolt"
)

type DbTransaction struct {
	conn *DbConnection
	tx   *bolt.Tx
}

func (tx *DbTransaction) SetServiceName(bucketName string) error {
	_, err := tx.tx.CreateBucketIfNotExists([]byte(bucketName))
	return err
}

func (tx *DbTransaction) GetObject(bucketName string, key []byte, object interface{}) error {
	bucket := tx.tx.Bucket([]byte(bucketName))

	value := bucket.Get(key)
	if value == nil {
		return dserrors.ErrObjectNotFound
	}

	data := make([]byte, len(value))
	copy(data, value)

	return tx.conn.UnmarshalObjectWithJsoniter(data, object)
}

func (tx *DbTransaction) UpdateObject(bucketName string, key []byte, object interface{}) error {
	data, err := tx.conn.MarshalObject(object)
	if err != nil {
		return err
	}

	bucket := tx.tx.Bucket([]byte(bucketName))
	return bucket.Put(key, data)
}

func (tx *DbTransaction) DeleteObject(bucketName string, key []byte) error {
	bucket := tx.tx.Bucket([]byte(bucketName))
	return bucket.Delete(key)
}

func (tx *DbTransaction) DeleteAllObjects(bucketName string, obj interface{}, matching func(o interface{}) (id int, ok bool)) error {
	bucket := tx.tx.Bucket([]byte(bucketName))

	cursor := bucket.Cursor()
	for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
		err := tx.conn.UnmarshalObject(v, &obj)
		if err != nil {
			return err
		}

		if id, ok := matching(obj); ok {
			err := bucket.Delete(tx.conn.ConvertToKey(id))
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (tx *DbTransaction) GetNextIdentifier(bucketName string) int {
	bucket := tx.tx.Bucket([]byte(bucketName))
	id, err := bucket.NextSequence()
	if err != nil {
		log.Error().Err(err).Str("bucket", bucketName).Msg("failed to get the next identifer")

		return 0
	}

	return int(id)
}

func (tx *DbTransaction) CreateObject(bucketName string, fn func(uint64) (int, interface{})) error {
	bucket := tx.tx.Bucket([]byte(bucketName))

	seqId, _ := bucket.NextSequence()
	id, obj := fn(seqId)

	data, err := tx.conn.MarshalObject(obj)
	if err != nil {
		return err
	}

	return bucket.Put(tx.conn.ConvertToKey(id), data)
}

func (tx *DbTransaction) CreateObjectWithId(bucketName string, id int, obj interface{}) error {
	bucket := tx.tx.Bucket([]byte(bucketName))
	data, err := tx.conn.MarshalObject(obj)
	if err != nil {
		return err
	}

	return bucket.Put(tx.conn.ConvertToKey(id), data)
}

func (tx *DbTransaction) CreateObjectWithStringId(bucketName string, id []byte, obj interface{}) error {
	bucket := tx.tx.Bucket([]byte(bucketName))
	data, err := tx.conn.MarshalObject(obj)
	if err != nil {
		return err
	}

	return bucket.Put(id, data)
}

func (tx *DbTransaction) GetAll(bucketName string, obj interface{}, append func(o interface{}) (interface{}, error)) error {
	bucket := tx.tx.Bucket([]byte(bucketName))

	cursor := bucket.Cursor()
	for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
		err := tx.conn.UnmarshalObject(v, obj)
		if err != nil {
			return err
		}

		obj, err = append(obj)
		if err != nil {
			return err
		}
	}

	return nil
}

func (tx *DbTransaction) GetAllWithJsoniter(bucketName string, obj interface{}, append func(o interface{}) (interface{}, error)) error {
	bucket := tx.tx.Bucket([]byte(bucketName))

	cursor := bucket.Cursor()
	for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
		err := tx.conn.UnmarshalObjectWithJsoniter(v, obj)
		if err != nil {
			return err
		}

		obj, err = append(obj)
		if err != nil {
			return err
		}
	}

	return nil
}

func (tx *DbTransaction) GetAllWithKeyPrefix(bucketName string, keyPrefix []byte, obj interface{}, append func(o interface{}) (interface{}, error)) error {
	cursor := tx.tx.Bucket([]byte(bucketName)).Cursor()

	for k, v := cursor.Seek(keyPrefix); k != nil && bytes.HasPrefix(k, keyPrefix); k, v = cursor.Next() {
		err := tx.conn.UnmarshalObjectWithJsoniter(v, obj)
		if err != nil {
			return err
		}

		obj, err = append(obj)
		if err != nil {
			return err
		}
	}

	return nil
}
