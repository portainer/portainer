package edge

import (
	"encoding/base64"
	"errors"
	"strconv"
	"strings"
	"unicode"
)

// GetPortainerURLFromEdgeKey returns the portainer URL from an edge key
// format: <portainer_instance_url>|<tunnel_server_addr>|<tunnel_server_fingerprint>|<endpoint_id>
func GetPortainerURLFromEdgeKey(edgeKey string) (string, error) {
	decodedKey, err := base64.RawStdEncoding.DecodeString(edgeKey)
	if err != nil {
		return "", err
	}

	keyInfo := strings.Split(string(decodedKey), "|")

	if len(keyInfo) != 4 {
		return "", errors.New("invalid key format")
	}

	_, err = strconv.Atoi(keyInfo[3])
	if err != nil {
		return "", errors.New("invalid key format")
	}

	return keyInfo[0], nil
}

// IsValidEdgeStackName validates an edge stack name
// Edge stack name must be between 1 and 255 characters long
// and can only contain lowercase letters, digits, hyphens and underscores
// Edge stack name must start with either a lowercase letter or a digit
func IsValidEdgeStackName(name string) bool {
	if len(name) == 0 || len(name) > 255 {
		return false
	}

	if !unicode.IsLower(rune(name[0])) && !unicode.IsDigit(rune(name[0])) {
		return false
	}

	for _, r := range name {
		if !(unicode.IsLower(r) || unicode.IsDigit(r) || r == '-' || r == '_') {
			return false
		}
	}
	return true
}
