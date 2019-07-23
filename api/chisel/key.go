package chisel

import (
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"
)

func (service *Service) GenerateEdgeKey(url, host string, endpointIdentifier int) string {
	keyInformation := []string{
		url,
		fmt.Sprintf("%s:%s", host, service.serverPort),
		service.serverFingerprint,
		strconv.Itoa(endpointIdentifier),
	}

	// portainer_instance_url|tunnel_server_addr|tunnel_server_fingerprint|endpoint_ID
	key := strings.Join(keyInformation, "|")
	return base64.RawStdEncoding.EncodeToString([]byte(key))
}
