package utils

import (
	"bytes"
	"io/ioutil"
	"net/http"
	"strconv"
)

// GetRequestAsMap returns the response content as a generic JSON object
func GetRequestAsMap(request *http.Request) (map[string]interface{}, error) {
	data, err := getRequestBody(request)
	if err != nil {
		return nil, err
	}

	return data.(map[string]interface{}), nil
}

// RewriteRequest will replace the existing request body with the one specified
// in parameters
func RewriteRequest(request *http.Request, newData interface{}) error {
	data, err := marshal(getContentType(request.Header), newData)
	if err != nil {
		return err
	}

	body := ioutil.NopCloser(bytes.NewReader(data))

	request.Body = body
	request.ContentLength = int64(len(data))

	if request.Header == nil {
		request.Header = make(http.Header)
	}
	request.Header.Set("Content-Length", strconv.Itoa(len(data)))

	return nil
}

func getRequestBody(request *http.Request) (interface{}, error) {
	isGzip := request.Header.Get("Content-Encoding") == "gzip"

	return getBody(request.Body, getContentType(request.Header), isGzip)
}
