package registryutils

import (
	"encoding/base64"
	"encoding/json"
	"github.com/portainer/portainer/api/dataservices/registry"
)

type (
	authHeader struct {
		Username      string `json:"username"`
		Password      string `json:"password"`
		ServerAddress string `json:"serveraddress"`
	}
)

// GetRegistryAuthHeader generate the X-Registry-Auth header from registry
func GetRegistryAuthHeader(registry *registry.Registry) (header string, err error) {
	authHeader := authHeader{
		ServerAddress: registry.URL,
	}

	authHeader.Username, authHeader.Password, err = GetRegEffectiveCredential(registry)
	if err != nil {
		return
	}

	headerData, err := json.Marshal(authHeader)
	if err != nil {
		return
	}

	header = base64.StdEncoding.EncodeToString(headerData)

	return
}
