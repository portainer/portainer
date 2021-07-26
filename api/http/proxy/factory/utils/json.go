package utils

import (
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"mime"

	"gopkg.in/yaml.v3"
)

// GetJSONObject will extract an object from a specific property of another JSON object.
// Returns nil if nothing is associated to the specified key.
func GetJSONObject(jsonObject map[string]interface{}, property string) map[string]interface{} {
	object := jsonObject[property]
	if object != nil {
		return object.(map[string]interface{})
	}
	return nil
}

// GetArrayObject will extract an array from a specific property of another JSON object.
// Returns nil if nothing is associated to the specified key.
func GetArrayObject(jsonObject map[string]interface{}, property string) []interface{} {
	object := jsonObject[property]
	if object != nil {
		return object.([]interface{})
	}
	return nil
}

func getBody(body io.ReadCloser, contentType string, isGzip bool) (interface{}, error) {
	if body == nil {
		return nil, errors.New("unable to parse response: empty response body")
	}

	reader := body

	if isGzip {
		gzipReader, err := gzip.NewReader(reader)
		if err != nil {
			return nil, err
		}

		reader = gzipReader
	}

	defer reader.Close()

	bodyBytes, err := ioutil.ReadAll(reader)
	if err != nil {
		return nil, err
	}

	err = body.Close()
	if err != nil {
		return nil, err
	}

	var data interface{}
	err = unmarshal(contentType, bodyBytes, &data)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func marshal(contentType string, data interface{}) ([]byte, error) {
	// Note: contentType can look like: "application/json" or "application/json; charset=utf-8"
	mediaType, _, err := mime.ParseMediaType(contentType)
	if err != nil {
		return nil, err
	}

	switch mediaType {
	case "application/yaml":
		return yaml.Marshal(data)
	case "application/json", "":
		return json.Marshal(data)
	}

	return nil, fmt.Errorf("content type is not supported for marshaling: %s", contentType)
}

func unmarshal(contentType string, body []byte, returnBody interface{}) error {
	// Note: contentType can look look like: "application/json" or "application/json; charset=utf-8"
	mediaType, _, err := mime.ParseMediaType(contentType)
	if err != nil {
		return err
	}

	switch mediaType {
	case "application/yaml":
		return yaml.Unmarshal(body, returnBody)
	case "application/json", "":
		return json.Unmarshal(body, returnBody)
	}

	return fmt.Errorf("content type is not supported for unmarshaling: %s", contentType)
}
