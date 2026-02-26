package gitlab

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
	"oras.land/oras-go/v2/registry/remote/retry"
)

// Repository represents a GitLab registry repository
type Repository struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Path      string `json:"path"`
	ProjectID int    `json:"project_id"`
	Location  string `json:"location"`
	CreatedAt string `json:"created_at"`
	Status    string `json:"status"`
}

// Client represents a GitLab API client
type Client struct {
	httpClient *http.Client
	baseURL    string
}

// NewClient creates a new GitLab API client
// it currently is an http client because only GetRegistryRepositoryNames is needed (oras supports other commands).
// if we need to support other commands, consider using the gitlab client library.
func NewClient(baseURL, token string) *Client {
	return &Client{
		httpClient: NewHTTPClient(token),
		baseURL:    baseURL,
	}
}

// GetRegistryRepositoryNames fetches registry repository names for a given project.
// It's a small http client wrapper instead of using the gitlab client library because listing repositories is the only known operation that isn't directly supported by oras
func (c *Client) GetRegistryRepositoryNames(ctx context.Context, projectID int) ([]string, error) {
	url := fmt.Sprintf("%s/api/v4/projects/%d/registry/repositories", c.baseURL, projectID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Warn().Err(err).Msg("failed to close response body")
		}
	}()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitLab API returned status %d: %s", resp.StatusCode, resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var repositories []Repository
	if err := json.Unmarshal(body, &repositories); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Extract repository names
	names := make([]string, len(repositories))
	for i, repo := range repositories {
		// the full path is required for further repo operations
		names[i] = repo.Path
	}

	return names, nil
}

type Transport struct {
	httpTransport *http.Transport
}

// NewTransport returns a pointer to a new instance of Transport that implements the HTTP Transport
// interface for proxying requests to the Gitlab API.
func NewTransport() *Transport {
	return &Transport{
		httpTransport: &http.Transport{},
	}
}

// RoundTrip is the implementation of the http.RoundTripper interface
func (transport *Transport) RoundTrip(request *http.Request) (*http.Response, error) {
	token := request.Header.Get("Private-Token")
	if token == "" {
		return nil, errors.New("no gitlab token provided")
	}

	r, err := http.NewRequest(request.Method, request.URL.String(), request.Body)
	if err != nil {
		return nil, err
	}

	r.Header.Set("Private-Token", token)
	return transport.httpTransport.RoundTrip(r)
}

// NewHTTPClient creates a new HTTP client configured for GitLab API requests
func NewHTTPClient(token string) *http.Client {
	return &http.Client{
		Transport: &tokenTransport{
			token:     token,
			transport: retry.NewTransport(&http.Transport{}), // Use ORAS retry transport for consistent rate limiting and error handling
		},
		Timeout: 1 * time.Minute,
	}
}

// tokenTransport automatically adds the Private-Token header to requests
type tokenTransport struct {
	token     string
	transport http.RoundTripper
}

func (t *tokenTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("Private-Token", t.token)
	return t.transport.RoundTrip(req)
}
