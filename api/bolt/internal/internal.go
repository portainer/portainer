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

// MarshalTeam encodes a team to binary format.
func MarshalTeam(team *portainer.Team) ([]byte, error) {
	return json.Marshal(team)
}

// UnmarshalTeam decodes a team from a binary data.
func UnmarshalTeam(data []byte, team *portainer.Team) error {
	return json.Unmarshal(data, team)
}

// MarshalTeamMembership encodes a team membership to binary format.
func MarshalTeamMembership(membership *portainer.TeamMembership) ([]byte, error) {
	return json.Marshal(membership)
}

// UnmarshalTeamMembership decodes a team membership from a binary data.
func UnmarshalTeamMembership(data []byte, membership *portainer.TeamMembership) error {
	return json.Unmarshal(data, membership)
}

// MarshalEndpoint encodes an endpoint to binary format.
func MarshalEndpoint(endpoint *portainer.Endpoint) ([]byte, error) {
	return json.Marshal(endpoint)
}

// UnmarshalEndpoint decodes an endpoint from a binary data.
func UnmarshalEndpoint(data []byte, endpoint *portainer.Endpoint) error {
	return json.Unmarshal(data, endpoint)
}

// MarshalResourceControl encodes a resource control object to binary format.
func MarshalResourceControl(rc *portainer.ResourceControl) ([]byte, error) {
	return json.Marshal(rc)
}

// UnmarshalResourceControl decodes a resource control object from a binary data.
func UnmarshalResourceControl(data []byte, rc *portainer.ResourceControl) error {
	return json.Unmarshal(data, rc)
}

// Itob returns an 8-byte big endian representation of v.
// This function is typically used for encoding integer IDs to byte slices
// so that they can be used as BoltDB keys.
func Itob(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	return b
}
