package migrator

import (
	"path"
	"time"

	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/portainer/portainer/api/bolt/settings"
)

// initTestingDBConn creates a raw bolt DB connection
// for unit testing usage only since using NewStore will cause cycle import inside migrator pkg
func initTestingDBConn(storePath, fileName string) (*bolt.DB, error) {
	databasePath := path.Join(storePath, fileName)
	dbConn, err := bolt.Open(databasePath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return nil, err
	}
	return dbConn, nil
}

// initTestingDBConn creates a settings service with raw bolt DB connection
// for unit testing usage only since using NewStore will cause cycle import inside migrator pkg
func initTestingSettingsService(dbConn *bolt.DB, preSetObj map[string]interface{}) (*settings.Service, error) {
	internalDBConn := &internal.DbConnection{
		DB: dbConn,
	}
	settingsService, err := settings.NewService(internalDBConn)
	if err != nil {
		return nil, err
	}
	//insert a obj
	if err := internal.UpdateObject(internalDBConn, "settings", []byte("SETTINGS"), preSetObj); err != nil {
		return nil, err
	}
	return settingsService, nil
}
