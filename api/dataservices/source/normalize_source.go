package source

import (
	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
)

type normalizedGitSource struct {
	url      string
	username string
	password string
}

func (a *normalizedGitSource) Equal(b *normalizedGitSource) bool {
	return a != nil && b != nil &&
		a.url == b.url &&
		a.username == b.username &&
		a.password == b.password
}

// normalize git source to a lighter object used to compare sources together
func normalizeGitSource(src *portainer.Source) (*normalizedGitSource, error) {
	if src == nil || src.Type != portainer.SourceTypeGit || src.Git == nil {
		return nil, ErrInvalidSource
	}

	url, err := gittypes.NormalizeURL(gittypes.SanitizeURL(src.Git.URL))
	if err != nil {
		return nil, err
	}

	username, password := "", ""
	if src.Git.Authentication != nil {
		username = src.Git.Authentication.Username
		password = src.Git.Authentication.Password
	}

	return &normalizedGitSource{
		url:      url,
		username: username,
		password: password,
	}, nil
}
