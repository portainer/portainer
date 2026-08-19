package git

import (
	gittypes "github.com/portainer/portainer/api/git/types"
)

func GetCredentials(auth *gittypes.GitAuthentication) (string, string) {
	if auth == nil {
		return "", ""
	}

	return auth.Username, auth.Password
}
