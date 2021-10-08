package errors

import "errors"

var (
	ErrObjectNotFound = errors.New("Object not found inside the database")
	ErrWrongDBEdition = errors.New("The Portainer database is set for Portainer Business Edition, please follow the instructions in our documentation to downgrade it: https://documentation.portainer.io/v2.0-be/downgrade/be-to-ce/")
)
