package registryproxy

import (
	"bytes"
	"encoding/json"
	portainer "github.com/portainer/portainer/api"
	"io/ioutil"
	"net/http"
	"regexp"
)

func requestToken(response *http.Response, config *portainer.RegistryManagementConfiguration) (*string, error) {
	client := &http.Client{}

	wwwAuthenticateHeader := response.Header.Get("Www-Authenticate")
	authenticationDetails := extractWWWAuthenticateValues(wwwAuthenticateHeader)

	authRequest, err := http.NewRequest(http.MethodGet, authenticationDetails["realm"], nil)
	if err != nil {
		return nil, err
	}

	q := authRequest.URL.Query()
	if authenticationDetails["service"] != "" {
		q.Add("service", authenticationDetails["service"])
	}
	if authenticationDetails["scope"] != "" {
		q.Add("scope", authenticationDetails["scope"])
	}
	authRequest.URL.RawQuery = q.Encode()
	authRequest.SetBasicAuth(config.Username, config.Password)

	authResponse, err := client.Do(authRequest)
	if err != nil {
		return nil, err
	}
	defer authResponse.Body.Close()

	token, err := retrieveToken(authResponse, config.Type)

	return &token, err
}

func retrieveToken(response *http.Response, registryType portainer.RegistryType) (string, error) {
	token := ""
	if registryType == portainer.AzureRegistry {
		var responseData azureAuthenticationResponse
		err := json.NewDecoder(response.Body).Decode(&responseData)
		if err != nil {
			return token, err
		}
		token = responseData.AccessToken
	} else {
		var responseData genericAuthenticationResponse
		err := json.NewDecoder(response.Body).Decode(&responseData)
		if err != nil {
			return token, err
		}
		token = responseData.AccessToken
	}
	return token, nil
}

var wwwAuthenticateHeaderRegexp = regexp.MustCompile(`(realm|service|scope)="(.*?)"`)

func extractWWWAuthenticateValues(s string) map[string]string {
	data := wwwAuthenticateHeaderRegexp.FindAllStringSubmatch(s, -1)

	result := make(map[string]string)
	for _, kv := range data {
		k := kv[1]
		v := kv[2]
		result[k] = v
	}

	return result
}

func cloneRequest(originRequest *http.Request) (*http.Request, error) {
	clonedRequest := originRequest.Clone(originRequest.Context())

	if originRequest.Body != nil {
		body, err := ioutil.ReadAll(originRequest.Body)
		if err != nil {
			return nil, err
		}

		originRequest.Body = ioutil.NopCloser(bytes.NewReader(body))
		clonedRequest.Body = ioutil.NopCloser(bytes.NewReader(body))
	}

	return clonedRequest, nil
}
