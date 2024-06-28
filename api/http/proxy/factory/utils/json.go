package utils

import (
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"mime"

	"github.com/segmentio/encoding/json"
	"gopkg.in/yaml.v3"
)

// GetJSONObject will extract an object from a specific property of another JSON object.
// Returns nil if nothing is associated to the specified key.
func GetJSONObject(jsonObject map[string]any, property string) map[string]any {
	object := jsonObject[property]
	if object != nil {
		return object.(map[string]any)
	}
	return nil
}

// GetArrayObject will extract an array from a specific property of another JSON object.
// Returns nil if nothing is associated to the specified key.
func GetArrayObject(jsonObject map[string]any, property string) []any {
	object := jsonObject[property]
	if object != nil {
		return object.([]any)
	}
	return nil
}

func getBody(body io.ReadCloser, contentType string, isGzip bool) (any, error) {
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

	var data any
	err := unmarshal(contentType, reader, &data)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func marshal(contentType string, data any) ([]byte, error) {
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

func unmarshal(contentType string, body io.Reader, returnBody any) error {
	// Note: contentType can look like: "application/json" or "application/json; charset=utf-8"
	mediaType, _, err := mime.ParseMediaType(contentType)
	if err != nil {
		return err
	}

	switch mediaType {
	case "application/yaml":
		return yaml.NewDecoder(body).Decode(returnBody)
	case "application/json", "":
		return json.NewDecoder(body).Decode(returnBody)
	}

	return fmt.Errorf("content type is not supported for unmarshaling: %s", contentType)
}
