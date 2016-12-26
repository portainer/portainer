package internal

import (
	"github.com/portainer/portainer"

	"encoding/binary"
	"encoding/json"
)

// MarshalUser encodes a user to binary format.
func MarshalUser(user *portainer.User) ([]byte, error) {
	return json.Marshal(user)
}

// UnmarshalUser decodes a user from a binary data.
func UnmarshalUser(data []byte, user *portainer.User) error {
	return json.Unmarshal(data, user)
}

// MarshalEndpoint encodes an endpoint to binary format.
func MarshalEndpoint(endpoint *portainer.Endpoint) ([]byte, error) {
	return json.Marshal(endpoint)
}

// UnmarshalEndpoint decodes an endpoint from a binary data.
func UnmarshalEndpoint(data []byte, endpoint *portainer.Endpoint) error {
	return json.Unmarshal(data, endpoint)
}

// Itob returns an 8-byte big endian representation of v.
// This function is typically used for encoding integer IDs to byte slices
// so that they can be used as BoltDB keys.
func Itob(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	return b
}
