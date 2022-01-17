package backup

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"github.com/boltdb/bolt"
	"github.com/sirupsen/logrus"
)

// TODO: use portainer-cli to import
// source: https://github.com/portainer/portainer-cli/blob/master/util/database/import.go

func ImportJsonToDatabase(jsonFilePath, portainerDbPath string) error {
	if _, err := os.Stat(jsonFilePath); err != nil {
		return fmt.Errorf("import file not found: %s: %s", jsonFilePath, err)
	}
	// if _, err := os.Stat(portainerDbPath); err == nil {
	// 	return fmt.Errorf("ERROR: database file already exists: %s", portainerDbPath)
	// }

	return importJson(jsonFilePath, portainerDbPath)
}

func importJson(jsonFilePath, portainerDbPath string) error {
	backup := make(map[string]interface{})

	s, err := ioutil.ReadFile(jsonFilePath)
	if err != nil {
		return err
	}
	//err = json.Unmarshal([]byte(s), &backup)
	d := json.NewDecoder(bytes.NewReader(s))
	d.UseNumber()
	if err = d.Decode(&backup); err != nil {
		return err
	}

	connection, err := bolt.Open(portainerDbPath, 0600, &bolt.Options{Timeout: 2 * time.Second})
	if err != nil {
		return err
	}
	defer connection.Close()

	return connection.Update(func(tx *bolt.Tx) error {
		for bucketName, v := range backup {
			logrus.WithField("bucketName", bucketName).Printf("CreateBucketIfNotExists")
			_, err := tx.CreateBucketIfNotExists([]byte(bucketName))
			if err != nil {
				logrus.WithError(err).WithField("bucketName", bucketName).Printf("CreateBucketIfNotExists")
				return err
			}

			bucket := tx.Bucket([]byte(bucketName))

			switch bucketName {
			case "version":
				versions, ok := v.(map[string]interface{})
				if !ok {
					logrus.WithField("obj", v).Errorf("failed to cast %s map[string]interface{}", bucketName)
				} else {
					// TODO: test if those exist...
					Put(bucketName, bucket, "DB_VERSION", versions["DB_VERSION"])
					Put(bucketName, bucket, "INSTANCE_ID", versions["INSTANCE_ID"])
				}
			case "dockerhub":
				Put(bucketName, bucket, "DOCKERHUB", v)

				//obj, ok := v.([]map[string]string)
				//if !ok {
				//	logrus.WithField("obj", v).Errorf("failed to cast %s []map[string]interface{}", bucketName)
				//} else {
				//	Put(bucketName, bucket, "DOCKERHUB", obj)
				//}
			case "ssl":
				obj, ok := v.(map[string]interface{})
				if !ok {
					logrus.WithField("obj", v).Errorf("failed to cast %s map[string]interface{}", bucketName)
				} else {
					Put(bucketName, bucket, "SSL", obj)
				}
			case "settings":
				obj, ok := v.(map[string]interface{})
				if !ok {
					logrus.WithField("obj", v).Errorf("failed to cast %s map[string]interface{}", bucketName)
				} else {
					Put(bucketName, bucket, "SETTINGS", obj)
				}
			case "tunnel_server":
				obj, ok := v.(map[string]interface{})
				if !ok {
					logrus.WithField("obj", v).Errorf("failed to cast %s map[string]interface{}", bucketName)
				} else {
					Put(bucketName, bucket, "INFO", obj)
				}
			default:
				objlist, ok := v.([]interface{})
				if !ok {
					logrus.WithField("obj", v).Errorf("failed to cast %s []inferface{}", bucketName)
				} else {
					for _, ivalue := range objlist {
						value, ok := ivalue.(map[string]interface{})
						if !ok {
							logrus.WithField("obj", value).Errorf("failed to cast %s map[string]interface{}", bucketName)
						} else {
							var ok bool
							var id interface{}
							switch bucketName {
							case "endpoint_relations":
								id, ok = value["EndpointID"] // TODO: need to make into an int, then do that weird stringification
							default:
								id, ok = value["Id"]
							}
							if !ok {
								// endpoint_relations: EndpointID
								logrus.WithField("obj", value).Errorf("No Id field:%s ", bucketName)
								id = "error"
							}
							n, ok := id.(json.Number)
							if !ok {
								logrus.WithField("id", id).WithField("value", value).Errorf("failed to cast %s to int", bucketName)
							} else {
								key, err := n.Int64()
								if err != nil {
									logrus.WithError(err).WithField("id", id).WithField("key", key).WithField("value", value).Errorf("failed to cast %s to int", bucketName)
								} else {
									Put(bucketName, bucket, string(ConvertToKey(int(key))), value)
								}
							}
						}
					}
				}
			}
		}

		return nil
	})
}

// Honestly, I dunno why...
func ConvertToKey(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	return b
}

func Put(bucketName string, bucket *bolt.Bucket, key string, object interface{}) error {
	//logrus.WithField("bucketName", bucketName).WithField("key", key).WithField("object", object).Printf("Put")
	data, err := json.Marshal(object)
	if err != nil {
		logrus.WithError(err).WithField("bucketName", bucketName).WithField("key", key).WithField("object", object).Errorf("failed marshal to json: (bucket: %s), (key: %s)", bucketName, key)

		return err
	}

	err = bucket.Put([]byte(key), data)
	if err != nil {
		logrus.WithError(err).Errorf("failed Put into boltdb: (bucket: %s), (key: %s)", bucketName, key)

		return err
	}
	return nil
}
