package oauth

import (
	"errors"
	"fmt"

	portainer "github.com/portainer/portainer/api"
)

func getUsername(datamap map[string]interface{}, configuration *portainer.OAuthSettings) (string, error) {
	username, ok := datamap[configuration.UserIdentifier].(string)
	if ok && username != "" {
		return username, nil
	}

	if !ok {
		username, ok := datamap[configuration.UserIdentifier].(float64)
		if ok && username != 0 {
			return fmt.Sprint(int(username)), nil
		}
	}

	return "", errors.New("failed to extract username from oauth resource")
}
