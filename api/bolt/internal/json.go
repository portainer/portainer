package internal

import (
	"encoding/json"

	jsoniter "github.com/json-iterator/go"
)

// MarshalObject encodes an object to binary format
func MarshalObject(object interface{}) ([]byte, error) {
	return json.Marshal(object)
}

// UnmarshalObject decodes an object from binary data
func UnmarshalObject(data []byte, object interface{}) error {
	return json.Unmarshal(data, object)
}

// UnmarshalObjectWithJsoniter decodes an object from binary data
// using the jsoniter library. It is mainly used to accelerate environment(endpoint)
// decoding at the moment.
func UnmarshalObjectWithJsoniter(data []byte, object interface{}) error {
	var jsoni = jsoniter.ConfigCompatibleWithStandardLibrary
	return jsoni.Unmarshal(data, &object)
}
