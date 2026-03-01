package oauth

import (
	"context"
	"io"
	"maps"
	"mime"
	"net/http"
	"net/url"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"

	"github.com/golang-jwt/jwt/v5"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
	"golang.org/x/oauth2"
)

// Service represents a service used to authenticate users against an authorization server
type Service struct{}

// NewService returns a pointer to a new instance of this service
func NewService() Service {
	return Service{}
}

// Authenticate takes an access code and exchanges it for an access token from portainer OAuthSettings token environment(endpoint).
// On success, it will then return the username and token expiry time associated to authenticated user by fetching this information
// from the resource server and matching it with the user identifier setting.
func (Service) Authenticate(ctx context.Context, code string, configuration *portainer.OAuthSettings) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, time.Minute)
	defer cancel()

	token, err := GetOAuthToken(ctx, code, configuration)
	if err != nil {
		log.Error().Err(err).Msg("failed retrieving oauth token")

		return "", err
	}

	idToken, err := GetIdToken(token)
	if err != nil {
		log.Error().Err(err).Msg("failed parsing id_token")
	}

	resource, err := GetResource(ctx, token.AccessToken, configuration.ResourceURI)
	if err != nil {
		log.Error().Err(err).Msg("failed retrieving resource")

		return "", err
	}

	maps.Copy(resource, idToken)

	username, err := GetUsername(resource, configuration.UserIdentifier)
	if err != nil {
		log.Error().Err(err).Msg("failed retrieving username")

		return "", err
	}

	return username, nil
}

func GetOAuthToken(ctx context.Context, code string, configuration *portainer.OAuthSettings) (*oauth2.Token, error) {
	unescapedCode, err := url.QueryUnescape(code)
	if err != nil {
		return nil, err
	}

	config := buildConfig(configuration)

	return config.Exchange(ctx, unescapedCode)
}

// GetIdToken retrieves parsed id_token from the OAuth token response.
// This is necessary for OAuth providers like Azure
// that do not provide information about user groups on the user resource endpoint.
func GetIdToken(token *oauth2.Token) (map[string]any, error) {
	tokenData := make(map[string]any)

	idToken := token.Extra("id_token")
	if idToken == nil {
		return tokenData, nil
	}

	jwtParser := jwt.NewParser(jwt.WithoutClaimsValidation())

	t, _, err := jwtParser.ParseUnverified(idToken.(string), jwt.MapClaims{})
	if err != nil {
		return tokenData, errors.Wrap(err, "failed to parse id_token")
	}

	if claims, ok := t.Claims.(jwt.MapClaims); ok {
		maps.Copy(tokenData, claims)
	}

	return tokenData, nil
}

func GetResource(ctx context.Context, token string, resourceURI string) (map[string]any, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, resourceURI, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Warn().Err(err).Msg("failed to close response body")
		}
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, &oauth2.RetrieveError{
			Response: resp,
			Body:     body,
		}
	}

	// Some OAuth providers (e.g. Cloudflare Access) return malformed Content-Type headers
	// (e.g. "application/json; charset=utf-8, application/json") that mime.ParseMediaType
	// cannot parse. We intentionally ignore that error: if parsing fails, content is empty,
	// the urlencoded branch is skipped, and json.Unmarshal below acts as the final validator.
	originalContentType := resp.Header.Get("Content-Type")
	content, _, err := mime.ParseMediaType(originalContentType)
	if err != nil {
		log.Debug().
			Err(err).
			Str("context", "OAuthResourceFetch").
			Str("original_content_type", originalContentType).
			Str("parsed_content_type", content).
			Msg("Failed to parse Content-Type header from resource endpoint, falling back to JSON")
	}

	if content == "application/x-www-form-urlencoded" || content == "text/plain" {
		values, err := url.ParseQuery(string(body))
		if err != nil {
			return nil, err
		}

		datamap := make(map[string]any)
		for k, v := range values {
			if len(v) == 0 {
				datamap[k] = ""
			} else {
				datamap[k] = v[0]
			}
		}

		return datamap, nil
	}

	var datamap map[string]any
	if err = json.Unmarshal(body, &datamap); err != nil {
		return nil, err
	}

	return datamap, nil
}

func buildConfig(config *portainer.OAuthSettings) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     config.ClientID,
		ClientSecret: config.ClientSecret,
		RedirectURL:  config.RedirectURI,
		Scopes:       strings.Split(config.Scopes, ","),
		Endpoint: oauth2.Endpoint{
			AuthURL:   config.AuthorizationURI,
			TokenURL:  config.AccessTokenURI,
			AuthStyle: config.AuthStyle,
		},
	}
}
