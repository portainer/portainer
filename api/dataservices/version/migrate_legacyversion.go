package version

import (
	portaineree "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/models"
	"github.com/portainer/portainer/api/dataservices"
)

const (
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

// migrateLegacyVersion to new Version struct
func (service *Service) migrateLegacyVersion() error {
	dbVersion := 24
	edition := int(portaineree.PortainerCE)
	instanceId := ""

	// If we already have a version key, we don't need to migrate
	_, err := service.Version()
	if err != nil {
		if !dataservices.IsErrObjectNotFound(err) {
			return err
		}
	} else {
		return nil
	}

	err = service.connection.GetObject(BucketName, []byte(legacyDBVersionKey), &dbVersion)
	if err != nil && !dataservices.IsErrObjectNotFound(err) {
		return err
	}

	err = service.connection.GetObject(BucketName, []byte(legacyEditionKey), &edition)
	if err != nil && !dataservices.IsErrObjectNotFound(err) {
		return err
	}

	err = service.connection.GetObject(BucketName, []byte(legacyInstanceKey), &instanceId)
	if err != nil && !dataservices.IsErrObjectNotFound(err) {
		return err
	}

	err = service.StoreIsUpdating(true)
	if err != nil {
		return err
	}

	v := &models.Version{
		SchemaVersion: dbVersionToSemanticVersion(dbVersion),
		Edition:       edition,
		InstanceID:    string(instanceId),
	}

	err = service.UpdateVersion(v)
	if err != nil {
		return err
	}

	// Remove legacy keys if present
	service.connection.DeleteObject(BucketName, []byte(legacyDBVersionKey))
	service.connection.DeleteObject(BucketName, []byte(legacyEditionKey))
	service.connection.DeleteObject(BucketName, []byte(legacyInstanceKey))

	err = service.StoreIsUpdating(false)
	if err != nil {
		return err
	}

	return nil
}
