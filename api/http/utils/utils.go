package utils

import (
	"bytes"
	"io/ioutil"
	"net/http"

	"github.com/pkg/errors"
)

// CopyBody copies the request body and recreates it
func CopyBody(request *http.Request) ([]byte, error) {
	if request.Body == nil {
		return nil, nil
	}

	bodyBytes, err := ioutil.ReadAll(request.Body)
	if err != nil {
		return nil, errors.Wrap(err, "unable to read body")
	}

	request.Body.Close()
	// recreate body to pass to actual request handler
	request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))

	return bodyBytes, nil
}
