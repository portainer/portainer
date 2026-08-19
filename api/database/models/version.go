package models

type Version struct {
	SchemaVersion string
	MigratorCount int
	Edition       int
	InstanceID    string
}
