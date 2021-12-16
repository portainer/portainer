package boltdb

import (
	"encoding/json"
	"strconv"

	jsoniter "github.com/json-iterator/go"
)

// MarshalObject encodes an object to binary format
func MarshalObject(object interface{}) ([]byte, error) {
	// Special case for the VERSION bucket. Here we're not using json
	switch v := object.(type) {
	case int:
		return []byte(strconv.Itoa(v)), nil
	case string:
		return []byte(v), nil
	}

	return json.Marshal(object)
}

// UnmarshalObject decodes an object from binary data
func UnmarshalObject(data []byte, object interface{}) error {
	// Special case for the VERSION bucket. Here we're not using json
	// So we need to return it as a string
	err := json.Unmarshal(data, object)
	if err != nil {
		if s, ok := object.(*string); ok {
			*s = string(data)
		}
	}

	return nil
}

// UnmarshalObjectWithJsoniter decodes an object from binary data
// using the jsoniter library. It is mainly used to accelerate environment(endpoint)
// decoding at the moment.
func UnmarshalObjectWithJsoniter(data []byte, object interface{}) error {
	var jsoni = jsoniter.ConfigCompatibleWithStandardLibrary
	return jsoni.Unmarshal(data, &object)
}
