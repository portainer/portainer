package utils

import "strconv"

type EdgeError struct {
	// endpoint represents either the ID or the name of the endpoint
	endpoint string
	err      error
}

func NewEdgeError(endpoint string, err error) *EdgeError {
	return &EdgeError{
		endpoint: endpoint,
		err:      err,
	}
}

func (e *EdgeError) Error() string {
	errMsg := "Edge poll error"
	if e.err != nil {
		errMsg += ": " + e.err.Error()
	}

	if e.endpoint != "" {
		if _, err := strconv.Atoi(e.endpoint); err == nil {
			errMsg += ". Environment ID: " + e.endpoint
			return errMsg
		}

		errMsg += ". Environment: " + e.endpoint
	}
	return errMsg
}
