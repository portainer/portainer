package errors

import (
	"errors"
)

var (
	ErrObjectNotFound     = errors.New("object not found inside the database")
	ErrWrongDBEdition     = errors.New("the Portainer database is set for Portainer Business Edition, please follow the instructions in our documentation to downgrade it: https://docs.portainer.io/faqs/upgrading/can-i-downgrade-from-portainer-business-to-portainer-ce")
	ErrDBImportFailed     = errors.New("importing backup failed")
	ErrDatabaseIsUpdating = errors.New("database is currently in updating state. Failed prior upgrade. Please restore from backup or delete the database and restart Portainer")
)
