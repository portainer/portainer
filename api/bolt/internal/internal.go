package internal

import (
	"github.com/portainer/portainer"

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
