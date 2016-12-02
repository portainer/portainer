package main

import (
	"encoding/json"
	"errors"
	"github.com/boltdb/bolt"
)

const (
	administratorDefaultUsername = "admin"
	administratorDefaultPassword = "admin"
	userBucketName               = "users"
)

type (
	dataStore struct {
		db *bolt.DB
	}

	userItem struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
)

var (
	errUserNotFound = errors.New("User not found")
)

func (dataStore *dataStore) retrieveUser(username string) (*userItem, error) {
	var data []byte

	err := dataStore.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(userBucketName))
		value := bucket.Get([]byte(username))
		if value == nil {
			return errUserNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return nil, err
	}

	var user userItem
	err = json.Unmarshal(data, &user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func encodeDefaultUser() ([]byte, error) {
	user := &userItem{
		Username: administratorDefaultUsername,
		Password: administratorDefaultPassword,
	}

	buffer, err := json.Marshal(user)
	if err != nil {
		return nil, err
	}

	return buffer, nil
}

func (dataStore *dataStore) initUsers() error {
	return dataStore.db.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists([]byte(userBucketName))
		if err != nil {
			return err
		}

		value := bucket.Get([]byte(administratorDefaultUsername))
		if value == nil {
			user, err := encodeDefaultUser()
			if err != nil {
				return err
			}

			err = bucket.Put([]byte(administratorDefaultUsername), user)
			if err != nil {
				return err
			}
		}

		return nil
	})
}

func (dataStore *dataStore) cleanUp() {
	dataStore.db.Close()
}

func newDataStore(databasePath string) (*dataStore, error) {
	db, err := bolt.Open(databasePath, 0600, nil)
	if err != nil {
		return nil, err
	}

	return &dataStore{
		db: db,
	}, nil
}
