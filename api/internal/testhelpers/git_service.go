package testhelpers

import (
	"context"

	portainer "github.com/portainer/portainer/api"
)

type gitService struct {
	cloneErr error
	id       string
}

// NewGitService creates new mock for portainer.GitService.
func NewGitService(cloneErr error, id string) portainer.GitService {
	return &gitService{
		cloneErr: cloneErr,
		id:       id,
	}
}

func (g *gitService) CloneRepository(
	_ context.Context,
	destination,
	repositoryURL,
	referenceName,
	username,
	password string,
	tlsSkipVerify bool,
) error {
	return g.cloneErr
}

func (g *gitService) LatestCommitID(
	_ context.Context,
	repositoryURL,
	referenceName,
	username,
	password string,
	tlsSkipVerify bool,
) (string, error) {
	return g.id, nil
}

func (g *gitService) ListRefs(
	_ context.Context,
	repositoryURL,
	username,
	password string,
	hardRefresh bool,
	tlsSkipVerify bool,
) ([]string, error) {
	return nil, nil
}

func (g *gitService) ListFiles(
	_ context.Context,
	repositoryURL,
	referenceName,
	username,
	password string,
	dirOnly,
	hardRefresh bool,
	includedExts []string,
	tlsSkipVerify bool,
) ([]string, error) {
	return nil, nil
}
