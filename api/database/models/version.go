package models

import (
	"net/http"
)

const (
	VersionKey       string = "DB_VERSION"
	InstanceKey      string = "INSTANCE_ID"
	EditionKey       string = "EDITION"
	UpdatingKey      string = "DB_UPDATING"
	MigratorCountKey string = "MIGRATOR_COUNT"
	SchemaVersionKey string = "SCHEMA_VERSION"
)

type Version struct {
	Key   string `json:"Key" gorm:"unique,primaryKey"`
	Value string `json:"Value"`
}

func (r *Version) Validate(request *http.Request) error {
	return nil
}
