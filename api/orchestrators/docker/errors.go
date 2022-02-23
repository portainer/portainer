package docker

import "errors"

// Docker errors
var (
	ErrUnableToPingEndpoint = errors.New("Unable to communicate with the environment")
)
