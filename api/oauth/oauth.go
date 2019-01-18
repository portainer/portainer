package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"mime"
	"net/http"
	"net/url"
	"strings"

	"github.com/portainer/portainer"
	"golang.org/x/oauth2"
)

const (
	// ErrInvalidCode defines an error raised when the user authorization code is invalid
	ErrInvalidCode = portainer.Error("Invalid OAuth authorization code")
)

// Service represents a service used to authenticate users against an authorization server
type Service struct{}

// GetAccessToken takes an access code and exchanges it for an access token from portainer OAuthSettings token endpoint
func (*Service) GetAccessToken(code string, settings *portainer.OAuthSettings) (string, error) {
	config := buildConfig(settings)
	token, err := config.Exchange(context.Background(), code)
	return token.AccessToken, err
}

// GetUsername takes a token and retrieves the portainer OAuthSettings user identifier from resource server.
func (*Service) GetUsername(token string, settings *portainer.OAuthSettings) (string, error) {
	req, err := http.NewRequest("GET", settings.ResourceURI, nil)
	if err != nil {
		return "", err
	}

	client := &http.Client{}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", &oauth2.RetrieveError{
			Response: resp,
			Body:     body,
		}
	}

	content, _, err := mime.ParseMediaType(resp.Header.Get("Content-Type"))
	if err != nil {
		return "", err
	}

	if content == "application/x-www-form-urlencoded" || content == "text/plain" {
		values, err := url.ParseQuery(string(body))
		if err != nil {
			return "", err
		}

		username := values.Get(settings.UserIdentifier)
		return username, nil
	}

	var datamap map[string]interface{}
	if err = json.Unmarshal(body, &datamap); err != nil {
		return "", err
	}

	username, ok := datamap[settings.UserIdentifier].(string)
	if ok && username != "" {
		return username, nil
	}

	if !ok {
		username, ok := datamap[settings.UserIdentifier].(float64)
		if ok && username != 0 {
			return fmt.Sprint(int(username)), nil
		}
	}
	return "", &oauth2.RetrieveError{
		Response: resp,
		Body:     body,
	}
}

// BuildLoginURL creates a login url for the oauth provider
func (*Service) BuildLoginURL(oauthSettings *portainer.OAuthSettings) string {
	oauthConfig := buildConfig(oauthSettings)
	return oauthConfig.AuthCodeURL("portainer")
}

func buildConfig(oauthSettings *portainer.OAuthSettings) *oauth2.Config {
	endpoint := oauth2.Endpoint{
		AuthURL:  oauthSettings.AuthorizationURI,
		TokenURL: oauthSettings.AccessTokenURI,
	}

	return &oauth2.Config{
		ClientID:     oauthSettings.ClientID,
		ClientSecret: oauthSettings.ClientSecret,
		Endpoint:     endpoint,
		RedirectURL:  oauthSettings.RedirectURI,
		Scopes:       strings.Split(oauthSettings.Scopes, ","),
	}
}
