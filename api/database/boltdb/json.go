package boltdb

import (
	"encoding/json"
	"log"
	"strconv"

	jsoniter "github.com/json-iterator/go"
)

// MarshalObject encodes an object to binary format
func MarshalObject(object interface{}) ([]byte, error) {
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
	err := json.Unmarshal(data, object)
	if err != nil {
		log.Printf("%q", string(data))
		s := string(data)
		object = &s
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
