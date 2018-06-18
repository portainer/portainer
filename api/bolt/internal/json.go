package internal

import (
	"encoding/json"
)

// MarshalObject encodes an object to binary format
func MarshalObject(object interface{}) ([]byte, error) {
	return json.Marshal(object)
}

// UnmarshalObject decodes an object from binary data
func UnmarshalObject(data []byte, object interface{}) error {
	return json.Unmarshal(data, object)
}
