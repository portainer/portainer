package registryutils

import (
	"strconv"

	portainer "github.com/portainer/portainer/api"
)

func RegistrySecretName(registryID portainer.RegistryID) string {
	return "registry-" + strconv.Itoa(int(registryID))
}
