package boltdb

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/boltdb/bolt"
	"github.com/sirupsen/logrus"
)

// inspired by github.com/konoui/boltdb-exporter (which has no license)
// but very much simplified, based on how we use boltdb

func (c *DbConnection) exportJson(databasePath string) ([]byte, error) {
	logrus.WithField("databasePath", databasePath).Infof("exportJson")

	connection, err := bolt.Open(databasePath, 0600, &bolt.Options{Timeout: 1 * time.Second, ReadOnly: true})
	if err != nil {
		return []byte("{}"), err
	}
	defer connection.Close()

	backup := make(map[string]interface{})

	err = connection.View(func(tx *bolt.Tx) error {
		err = tx.ForEach(func(name []byte, bucket *bolt.Bucket) error {
			bucketName := string(name)
			var list []interface{}
			version := make(map[string]string)
			cursor := bucket.Cursor()
			for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
				if v == nil {
					continue
				}
				var obj interface{}
				err := c.UnmarshalObject(v, &obj)
				if err != nil {
					logrus.WithError(err).Errorf("Failed to unmarshal (bucket %s): %v", bucketName, string(v))
					obj = v
				}
				if bucketName == "version" {
					if string(k) == "DB_UPDATING" {
						continue
					}
					v, ok := obj.(string)
					if ok {
						version[string(k)] = v
					} else {
						if string(k) == "DB_VERSION" {
							if v, ok := obj.(int); ok {
								version[string(k)] = fmt.Sprintf("%s", v)
							}
						}
						logrus.WithError(err).Errorf("unknown type for (bucket version): key=%s value=%v", string(k), string(v))
					}
				} else {
					list = append(list, obj)
				}
			}
			if bucketName == "version" {
				backup[bucketName] = version
			}
			if len(list) > 0 {
				if bucketName == "ssl" ||
					bucketName == "settings" ||
					bucketName == "tunnel_server" {
					backup[bucketName] = list[0]
					return nil
				}
				backup[bucketName] = list
			}

			return nil
		})
		return err
	})
	if err != nil {
		return []byte("{}"), err
	}

	return json.MarshalIndent(backup, "", "  ")
}
