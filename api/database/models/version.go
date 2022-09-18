package models

type Version struct {
	SchemaVersion string `json:"SchemaVersion"`
	MigratorCount int    `json:"MigratorCount"`
	Edition       int    `json:"Edition"`
	InstanceID    string `json:"InstanceID"`
}
