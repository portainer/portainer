package testhelpers

import portainer "github.com/portainer/portainer/api"

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

func (g *gitService) CloneRepository(destination, repositoryURL, referenceName, username, password string) error {
	return g.cloneErr
}

func (g *gitService) LatestCommitID(repositoryURL, referenceName, username, password string) (string, error) {
	return g.id, nil
}

func (g *gitService) ListRefs(repositoryURL, username, password string, hardRefresh bool) ([]string, error) {
	return nil, nil
}

func (g *gitService) ListFiles(repositoryURL, referenceName, username, password string, hardRefresh bool, includedExts []string) ([]string, error) {
	return nil, nil
}
