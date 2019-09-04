package git

import (
	"crypto/tls"
	"net/http"
	"net/url"
	"strings"
	"time"

	"gopkg.in/src-d/go-git.v4"
	"gopkg.in/src-d/go-git.v4/plumbing"
	"gopkg.in/src-d/go-git.v4/plumbing/transport/client"
	githttp "gopkg.in/src-d/go-git.v4/plumbing/transport/http"
)

// Service represents a service for managing Git.
type Service struct {
	httpsCli *http.Client
}

// NewService initializes a new service.
func NewService() *Service {
	httpsCli := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
		Timeout: 300 * time.Second,
	}

	client.InstallProtocol("https", githttp.NewClient(httpsCli))

	return &Service{
		httpsCli: httpsCli,
	}
}

// ClonePublicRepository clones a public git repository using the specified URL in the specified
// destination folder.
func (service *Service) ClonePublicRepository(repositoryURL, referenceName string, destination string) error {
	return cloneRepository(repositoryURL, referenceName, destination)
}

// ClonePrivateRepositoryWithBasicAuth clones a private git repository using the specified URL in the specified
// destination folder. It will use the specified username and password for basic HTTP authentication.
func (service *Service) ClonePrivateRepositoryWithBasicAuth(repositoryURL, referenceName string, destination, username, password string) error {
	credentials := username + ":" + url.PathEscape(password)
	repositoryURL = strings.Replace(repositoryURL, "://", "://"+credentials+"@", 1)
	return cloneRepository(repositoryURL, referenceName, destination)
}

func cloneRepository(repositoryURL, referenceName, destination string) error {
	options := &git.CloneOptions{
		URL: repositoryURL,
	}

	if referenceName != "" {
		options.ReferenceName = plumbing.ReferenceName(referenceName)
	}

	_, err := git.PlainClone(destination, false, options)
	return err
}
