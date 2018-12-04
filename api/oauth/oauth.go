package oauth

import (
	"encoding/json"
	"fmt"
	"github.com/portainer/portainer"
	"golang.org/x/oauth2"
	"io"
	"io/ioutil"
	"mime"
	"net/http"
	"net/url"
	"strings"
)

const (
	// ErrInvalidCode defines an error raised when the user authorization code is invalid
	ErrInvalidCode = portainer.Error("Authorization code is invalid")
)

// OAuthService represents a service used to authenticate users against an authorization server
type Service struct{}

// GetAccessToken takes an access code and exchanges it for an access token from portainer OAuthSettings token endpoint
func (*Service) GetAccessToken(code string, settings *portainer.OAuthSettings) (string, error) {
	v := url.Values{}
	v.Set("client_id", settings.ClientID)
	v.Set("client_secret", settings.ClientSecret)
	v.Set("redirect_uri", settings.RedirectURI)
	v.Set("code", code)
	v.Set("grant_type", "authorization_code")

	req, err := http.NewRequest("POST", settings.AccessTokenURI, strings.NewReader(v.Encode()))
	if err != nil {
		return "", err
	}

	client := &http.Client{}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	r, err := client.Do(req)
	if err != nil {
		return "", err
	}

	body, err := ioutil.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		return "", fmt.Errorf("oauth2: cannot fetch token: %v", err)
	}

	content, _, _ := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if content == "application/x-www-form-urlencoded" || content == "text/plain" {
		values, err := url.ParseQuery(string(body))
		if err != nil {
			return "", err
		}

		token := values.Get("access_token")
		return token, nil
	}

	type tokenJSON struct {
		AccessToken string `json:"access_token"`
	}

	var tj tokenJSON
	if err = json.Unmarshal(body, &tj); err != nil {
		return "", err
	}

	token := tj.AccessToken
	return token, nil
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

	content, _, _ := mime.ParseMediaType(resp.Header.Get("Content-Type"))
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
		if ok {
			return fmt.Sprint(int(username)), nil
		}
	}
	return "", &oauth2.RetrieveError{
		Response: resp,
		Body:     body,
	}
}
