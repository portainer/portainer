package chisel

import (
	"encoding/base64"
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

// GenerateEdgeKey will generate a key that can be used by an Edge agent to register with a Portainer instance.
// The key represents the following data in this particular format:
// http(s)://serverURL|http(s)://host:tunnelServerPort|tunnel_server_fingerprint|endpoint_ID
// Protocol used to connect to the tunnel server will match the one used by the Portainer server (http or https).
// The key returned by this function is a base64 encoded version of the data.
func (service *Service) GenerateEdgeKey(serverURL, host string, endpointIdentifier int) (string, error) {
	u, err := url.Parse(serverURL)
	if err != nil {
		return "", err
	}

	keyInformation := []string{
		serverURL,
		fmt.Sprintf("%s://%s:%s", u.Scheme, host, service.serverPort),
		service.serverFingerprint,
		strconv.Itoa(endpointIdentifier),
	}

	key := strings.Join(keyInformation, "|")
	return base64.RawStdEncoding.EncodeToString([]byte(key)), nil
}
