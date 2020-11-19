package errors

import "errors"

var (
	ErrObjectNotFound = errors.New("Object not found inside the database")
	ErrMigrationToCE  = errors.New("DB is already on CE edition")
)
