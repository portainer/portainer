package boltdb

import (
	"time"

	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
	bolt "go.etcd.io/bbolt"
)

func backupMetadata(connection *bolt.DB) (map[string]any, error) {
	buckets := map[string]any{}

	err := connection.View(func(tx *bolt.Tx) error {
		err := tx.ForEach(func(name []byte, bucket *bolt.Bucket) error {
			bucketName := string(name)
			seqId := bucket.Sequence()
			buckets[bucketName] = int(seqId)
			return nil
		})

		return err
	})

	return buckets, err
}

// ExportJSON creates a JSON representation from a DbConnection. You can include
// the database's metadata or ignore it. Ensure the database is closed before
// using this function.
// inspired by github.com/konoui/boltdb-exporter (which has no license)
// but very much simplified, based on how we use boltdb
func (c *DbConnection) ExportJSON(databasePath string, metadata bool) ([]byte, error) {
	log.Debug().Str("databasePath", databasePath).Msg("exportJson")

	connection, err := bolt.Open(databasePath, 0600, &bolt.Options{Timeout: 1 * time.Second, ReadOnly: true})
	if err != nil {
		return []byte("{}"), err
	}
	defer connection.Close()

	backup := make(map[string]any)
	if metadata {
		meta, err := backupMetadata(connection)
		if err != nil {
			log.Error().Err(err).Msg("failed exporting metadata")
		}

		backup["__metadata"] = meta
	}

	if err := connection.View(func(tx *bolt.Tx) error {
		return tx.ForEach(func(name []byte, bucket *bolt.Bucket) error {
			bucketName := string(name)
			var list []any
			version := make(map[string]string)
			cursor := bucket.Cursor()
			for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
				if v == nil {
					continue
				}

				var obj any
				err := c.UnmarshalObject(v, &obj)
				if err != nil {
					log.Error().
						Str("bucket", bucketName).
						Str("object", string(v)).
						Err(err).
						Msg("failed to unmarshal")

					obj = v
				}

				if bucketName == "version" {
					version[string(k)] = string(v)
				} else {
					list = append(list, obj)
				}
			}

			if bucketName == "version" {
				backup[bucketName] = version
				return nil
			}

			if bucketName == "ssl" ||
				bucketName == "settings" ||
				bucketName == "tunnel_server" {
				backup[bucketName] = nil
				if len(list) > 0 {
					backup[bucketName] = list[0]
				}

				return nil
			}

			backup[bucketName] = list

			return nil
		})
	}); err != nil {
		return []byte("{}"), err
	}

	return json.MarshalIndent(backup, "", "  ")
}
