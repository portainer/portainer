package oauth

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"mime"
	"net/http"
	"net/url"
	"strings"

	portainer "github.com/portainer/portainer/api"

	"github.com/golang-jwt/jwt"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
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
	token, err := getOAuthToken(code, configuration)
	if err != nil {
		log.Debug().Err(err).Msg("failed retrieving oauth token")

		return "", err
	}

	idToken, err := getIdToken(token)
	if err != nil {
		log.Debug().Err(err).Msg("failed parsing id_token")
	}

	resource, err := getResource(token.AccessToken, configuration)
	if err != nil {
		log.Debug().Err(err).Msg("failed retrieving resource")

		return "", err
	}

	resource = mergeSecondIntoFirst(idToken, resource)

	username, err := getUsername(resource, configuration)
	if err != nil {
		log.Debug().Err(err).Msg("failed retrieving username")

		return "", err
	}

	return username, nil
}

// mergeSecondIntoFirst merges the overlap map into the base overwriting any existing values.
func mergeSecondIntoFirst(base map[string]interface{}, overlap map[string]interface{}) map[string]interface{} {
	for k, v := range overlap {
		base[k] = v
	}

	return base
}

func getOAuthToken(code string, configuration *portainer.OAuthSettings) (*oauth2.Token, error) {
	unescapedCode, err := url.QueryUnescape(code)
	if err != nil {
		return nil, err
	}

	config := buildConfig(configuration)
	token, err := config.Exchange(context.Background(), unescapedCode)
	if err != nil {
		return nil, err
	}

	return token, nil
}

// getIdToken retrieves parsed id_token from the OAuth token response.
// This is necessary for OAuth providers like Azure
// that do not provide information about user groups on the user resource endpoint.
func getIdToken(token *oauth2.Token) (map[string]interface{}, error) {
	tokenData := make(map[string]interface{})

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

func getResource(token string, configuration *portainer.OAuthSettings) (map[string]interface{}, error) {
	req, err := http.NewRequest("GET", configuration.ResourceURI, nil)
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
	body, err := ioutil.ReadAll(resp.Body)
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

		datamap := make(map[string]interface{})
		for k, v := range values {
			if len(v) == 0 {
				datamap[k] = ""
			} else {
				datamap[k] = v[0]
			}
		}
		return datamap, nil
	}

	var datamap map[string]interface{}
	if err = json.Unmarshal(body, &datamap); err != nil {
		return nil, err
	}

	return datamap, nil
}

func buildConfig(configuration *portainer.OAuthSettings) *oauth2.Config {
	endpoint := oauth2.Endpoint{
		AuthURL:  configuration.AuthorizationURI,
		TokenURL: configuration.AccessTokenURI,
	}

	return &oauth2.Config{
		ClientID:     configuration.ClientID,
		ClientSecret: configuration.ClientSecret,
		Endpoint:     endpoint,
		RedirectURL:  configuration.RedirectURI,
		Scopes:       strings.Split(configuration.Scopes, ","),
	}
}
