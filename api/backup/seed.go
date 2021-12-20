package backup

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/offlinegate"
)

// SeedStore seeds the store with provided JSON/map data, will trigger system shutdown, when finished.
// NOTE: THIS WILL COMPLETELY OVERWRITE THE CURRENT STORE - only use this for testing.
func SeedStore(storeData map[string]interface{}, filestorePath string, gate *offlinegate.OfflineGate, datastore dataservices.DataStore, shutdownTrigger context.CancelFunc) error {
	// write storeData map to a temporary file
	file, err := writeMapToFile(storeData)
	if err != nil {
		return err
	}
	defer os.Remove(file.Name())

	unlock := gate.Lock()
	defer unlock()

	if err := datastore.Close(); err != nil {
		return errors.Wrap(err, "Failed to stop db")
	}

	storePath := filepath.Join(filestorePath, boltdb.DatabaseFileName)
	// TODO: use portainer-cli to import
	if err := ImportJsonToDatabase(file.Name(), storePath); err != nil {
		return errors.Wrap(err, "Unable to import JSON data to database")
	}

	shutdownTrigger()
	return nil
}

// writeMapToFile writes a map to a temporary file and returns the file.
func writeMapToFile(mapData map[string]interface{}) (*os.File, error) {
	// map (json export) -> string
	jsonData, err := json.Marshal(mapData)
	if err != nil {
		return nil, err
	}

	// write string (json) to temporary file
	file, err := os.CreateTemp("", "temp-db-export-json")
	if err != nil {
		return nil, err
	}
	_, err = file.Write(jsonData)
	if err != nil {
		file.Close()
		return nil, err
	}
	if err = file.Close(); err != nil {
		return nil, err
	}

	return file, nil
}
