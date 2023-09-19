package datastore

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/models"
	"github.com/portainer/portainer/api/dataservices"
)

const (
	bucketName         = "version"
	legacyDBVersionKey = "DB_VERSION"
	legacyInstanceKey  = "INSTANCE_ID"
	legacyEditionKey   = "EDITION"
)

var dbVerToSemVerMap = map[int]string{
	18: "1.21",
	19: "1.22",
	20: "1.22.1",
	21: "1.22.2",
	22: "1.23",
	23: "1.24",
	24: "1.24.1",
	25: "2.0",
	26: "2.1",
	27: "2.2",
	28: "2.4",
	29: "2.4",
	30: "2.6",
	31: "2.7",
	32: "2.9",
	33: "2.9.1",
	34: "2.10",
	35: "2.9.3",
	36: "2.11",
	40: "2.13",
	50: "2.14",
	51: "2.14.1",
	52: "2.14.2",
	60: "2.15",
	61: "2.15.1",
	70: "2.16",
	80: "2.17",
}

func dbVersionToSemanticVersion(dbVersion int) string {
	if dbVersion < 18 {
		return "1.0.0"
	}

	ver, ok := dbVerToSemVerMap[dbVersion]
	if ok {
		return ver
	}

	// We should always return something sensible
	switch {
	case dbVersion < 40:
		return "2.11"
	case dbVersion < 50:
		return "2.13"
	case dbVersion < 60:
		return "2.14.2"
	case dbVersion < 70:
		return "2.15.1"
	}

	return "2.16.0"
}

// getOrMigrateLegacyVersion to new Version struct
func (store *Store) getOrMigrateLegacyVersion() (*models.Version, error) {
	// Very old versions of portainer did not have a version bucket, lets set some defaults
	dbVersion := 24
	edition := int(portainer.PortainerCE)
	instanceId := ""

	// If we already have a version key, we don't need to migrate
	v, err := store.VersionService.Version()
	if err == nil || !dataservices.IsErrObjectNotFound(err) {
		return v, err
	}

	err = store.connection.GetObject(bucketName, []byte(legacyDBVersionKey), &dbVersion)
	if err != nil && !dataservices.IsErrObjectNotFound(err) {
		return nil, err
	}

	err = store.connection.GetObject(bucketName, []byte(legacyEditionKey), &edition)
	if err != nil && !dataservices.IsErrObjectNotFound(err) {
		return nil, err
	}

	err = store.connection.GetObject(bucketName, []byte(legacyInstanceKey), &instanceId)
	if err != nil && !dataservices.IsErrObjectNotFound(err) {
		return nil, err
	}

	return &models.Version{
		SchemaVersion: dbVersionToSemanticVersion(dbVersion),
		Edition:       edition,
		InstanceID:    string(instanceId),
	}, nil
}

// finishMigrateLegacyVersion writes the new version to the DB and removes the old version keys from the DB
func (store *Store) finishMigrateLegacyVersion(versionToWrite *models.Version) error {
	err := store.VersionService.UpdateVersion(versionToWrite)

	// Remove legacy keys if present
	store.connection.DeleteObject(bucketName, []byte(legacyDBVersionKey))
	store.connection.DeleteObject(bucketName, []byte(legacyEditionKey))
	store.connection.DeleteObject(bucketName, []byte(legacyInstanceKey))
	return err
}
