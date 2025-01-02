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

	"github.com/golang-jwt/jwt/v4"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
	"golang.org/x/oauth2"
)

// Service represents a service used to authenticate users against an authorization server
type Service struct{}

// NewService returns a pointer to a new instance of this service
func NewService() *Service {
	return &Service{}
}

// Authenticate takes an access code and exchanges it for an access token from portainer OAuthSettings token environment(endpoint).
// On success, it will then return the username and token expiry time associated to authenticated user by fetching this information
// from the resource server and matching it with the user identifier setting.
func (*Service) Authenticate(code string, configuration *portainer.OAuthSettings) (string, error) {
	token, err := GetOAuthToken(code, configuration)
	if err != nil {
		log.Error().Err(err).Msg("failed retrieving oauth token")

		return "", err
	}

	idToken, err := GetIdToken(token)
	if err != nil {
		log.Error().Err(err).Msg("failed parsing id_token")
	}

	resource, err := GetResource(token.AccessToken, configuration.ResourceURI)
	if err != nil {
		log.Error().Err(err).Msg("failed retrieving resource")

		return "", err
	}

	maps.Copy(idToken, resource)

	username, err := GetUsername(resource, configuration.UserIdentifier)
	if err != nil {
		log.Error().Err(err).Msg("failed retrieving username")

		return "", err
	}

	return username, nil
}

func GetOAuthToken(code string, configuration *portainer.OAuthSettings) (*oauth2.Token, error) {
	unescapedCode, err := url.QueryUnescape(code)
	if err != nil {
		return nil, err
	}

	config := buildConfig(configuration)

	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

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

	jwtParser := jwt.Parser{
		SkipClaimsValidation: true,
	}

	t, _, err := jwtParser.ParseUnverified(idToken.(string), jwt.MapClaims{})
	if err != nil {
		return tokenData, errors.Wrap(err, "failed to parse id_token")
	}

	if claims, ok := t.Claims.(jwt.MapClaims); ok {
		for k, v := range claims {
			tokenData[k] = v
		}
	}

	return tokenData, nil
}

func GetResource(token string, resourceURI string) (map[string]any, error) {
	req, err := http.NewRequest(http.MethodGet, resourceURI, nil)
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

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

	content, _, err := mime.ParseMediaType(resp.Header.Get("Content-Type"))
	if err != nil {
		return nil, err
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
