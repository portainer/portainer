package git

import (
	gittypes "github.com/portainer/portainer/api/git/types"
)

func GetCredentials(auth *gittypes.GitAuthentication) (string, string, error) {
	if auth == nil {
		return "", "", nil
	}

	return auth.Username, auth.Password, nil
}
