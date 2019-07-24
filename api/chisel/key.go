package chisel

import (
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"
)

// GenerateEdgeKey will generate a key that can be used by an Edge agent to register with a Portainer instance.
// The key represents the following data in this particular format:
// portainer_instance_url|tunnel_server_addr|tunnel_server_fingerprint|endpoint_ID
// The key returned by this function is a base64 encoded version of the data.
func (service *Service) GenerateEdgeKey(url, host string, endpointIdentifier int) string {
	keyInformation := []string{
		url,
		fmt.Sprintf("%s:%s", host, service.serverPort),
		service.serverFingerprint,
		strconv.Itoa(endpointIdentifier),
	}

	key := strings.Join(keyInformation, "|")
	return base64.RawStdEncoding.EncodeToString([]byte(key))
}
