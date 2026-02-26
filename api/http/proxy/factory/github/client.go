package github

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
	"oras.land/oras-go/v2/registry/remote/retry"
)

const GitHubAPIHost = "https://api.github.com"

// Package represents a GitHub container package
type Package struct {
	Name  string `json:"name"`
	Owner struct {
		Login string `json:"login"`
	} `json:"owner"`
}

// Client represents a GitHub API client
type Client struct {
	httpClient *http.Client
	baseURL    string
}

// NewClient creates a new GitHub API client
func NewClient(token string) *Client {
	return &Client{
		httpClient: NewHTTPClient(token),
		baseURL:    GitHubAPIHost,
	}
}

// GetContainerPackages fetches container packages for the configured namespace
// It's a small http client wrapper instead of using the github client because listing repositories is the only known operation that isn't directly supported by oras
func (c *Client) GetContainerPackages(ctx context.Context, useOrganisation bool, organisationName string) ([]string, error) {
	// Determine the namespace (user or organisation) for the request
	namespace := "user"
	if useOrganisation {
		namespace = "orgs/" + organisationName
	}

	// Build the full URL for listing container packages
	url := fmt.Sprintf("%s/%s/packages?package_type=container", c.baseURL, namespace)

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
		return nil, fmt.Errorf("GitHub API returned status %d: %s", resp.StatusCode, resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var packages []Package
	if err := json.Unmarshal(body, &packages); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Extract repository names in the form "owner/name"
	repositories := make([]string, len(packages))
	for i, pkg := range packages {
		repositories[i] = fmt.Sprintf("%s/%s", strings.ToLower(pkg.Owner.Login), strings.ToLower(pkg.Name))
	}

	return repositories, nil
}

// NewHTTPClient creates a new HTTP client configured for GitHub API requests
func NewHTTPClient(token string) *http.Client {
	return &http.Client{
		Transport: &tokenTransport{
			token:     token,
			transport: retry.NewTransport(&http.Transport{}), // Use ORAS retry transport for consistent rate limiting and error handling
		},
		Timeout: 1 * time.Minute,
	}
}

// tokenTransport automatically adds the Bearer token header to requests
type tokenTransport struct {
	token     string
	transport http.RoundTripper
}

func (t *tokenTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	if t.token != "" {
		req.Header.Set("Authorization", "Bearer "+t.token)
		req.Header.Set("Accept", "application/vnd.github+json")
	}
	return t.transport.RoundTrip(req)
}
