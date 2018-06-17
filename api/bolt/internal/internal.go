package internal

import (
	"encoding/binary"
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

// Itob returns an 8-byte big endian representation of v.
// This function is typically used for encoding integer IDs to byte slices
// so that they can be used as BoltDB keys.
func Itob(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	return b
}
