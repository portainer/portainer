package testhelpers

type gitService struct{}

// NewGitService creates new mock for portainer.GitService.
func NewGitService() *gitService {
	return &gitService{}
}

func (service *gitService) CloneRepository(destination string, repositoryURL, referenceName string, auth bool, username, password string) error {
	return nil
}

func (service *gitService) PullRepository(path string, referenceName string, auth bool, username, password string) error {
	return nil
}
