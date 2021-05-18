package oauth

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"log"
	"mime"
	"net/http"
	"net/url"

	"golang.org/x/oauth2"

	portainer "github.com/portainer/portainer/api"
)

// Service represents a service used to authenticate users against an authorization server
type Service struct{}

// NewService returns a pointer to a new instance of this service
func NewService() *Service {
	return &Service{}
}

// Authenticate takes an access code and exchanges it for an access token from portainer OAuthSettings token endpoint.
// On success, it will then return an OAuthInfo struct associated to authenticated user.
// The OAuthInfo struct contains data that is obtained from the OAuth providers resource server.
// // On success, it will then return the username and token expiry time associated to authenticated user by fetching this information
// // from the resource server and matching it with the user identifier setting.
func (*Service) Authenticate(code string, configuration *portainer.OAuthSettings) (*portainer.OAuthInfo, error) {
	token, err := getAccessToken(code, configuration)
	if err != nil {
		log.Printf("[DEBUG] - Failed retrieving access token: %v", err)
		return nil, err
	}

	resource, err := getResource(token, configuration)
	if err != nil {
		log.Printf("[DEBUG] - Failed retrieving resource: %v", err)
		return nil, err
	}

	username, err := getUsername(resource, configuration)
	if err != nil {
		log.Printf("[DEBUG] - Failed retrieving username: %v", err)
		return nil, err
	}

	teams, err := getTeams(resource, configuration)
	if err != nil {
		log.Printf("[DEBUG] - Failed retrieving oauth teams: %v", err)
		return nil, err
	}

	return &portainer.OAuthInfo{Username: username, Teams: teams, ExpiryTime: &token.Expiry}, nil
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
		Scopes:       []string{configuration.Scopes},
	}
}
