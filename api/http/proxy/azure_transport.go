package proxy

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/portainer/portainer"
)

type azureTransport struct {
	credentials       *portainer.AzureCredentials
	httpsRoundTripper http.Transport
}

type token struct {
}

type tokenResponse struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    int    `json:"expires_in"`
	ExpiresOn    int    `json:"expires_on"`
	ExtExpiresIn int    `json:"ext_expires_in"`
	NotBefore    int    `json:"not_before"`
	Resource     string `json:"resource"`
	TokenType    string `json:"token_type"`
}

// $ http --form POST https://login.microsoftonline.com/TENANT_ID/oauth2/token \
// grant_type="client_credentials" \
// client_id=APP_ID \
// client_secret=KEY \
// resource=https://management.azure.com/

func authenticationRequest() (string, error) {
	client := &http.Client{
		Timeout: time.Second * 3,
	}

	appID := "eab9cdfa-a630-4e2e-9d85-f0b23c278db4"
	tenantID := "34d4c73d-4fff-4352-9ce2-df14c8d839f5"
	authenticationKey := "cOrXdK/1C35w8YQ8nH1/8qGwsz45JIYD5jxHKEEQtnk="

	loginURL := fmt.Sprintf("https://login.microsoftonline.com/%s/oauth2/token", tenantID)
	params := url.Values{
		"grant_type":    {"client_credentials"},
		"client_id":     {appID},
		"client_secret": {authenticationKey},
		"resource":      {"https://management.azure.com/"},
	}

	response, err := client.PostForm(loginURL, params)
	if err != nil {
		return "", err
	}

	var token tokenResponse
	err = json.NewDecoder(response.Body).Decode(token)
	if err != nil {
		return "", err
	}

	return token.AccessToken, nil
}

func (transport *azureTransport) RoundTrip(request *http.Request) (*http.Response, error) {

	// subID := "3ec9d775-b0d1-49b8-9d68-0297c0d6b280"

	token, err := authenticationRequest()
	if err != nil {
		return nil, err
	}

	// retrieve resource group and container group from query parameters.
	// e.g. /api/endpoints/<ID>/aci/groupName/
	// aciURL := fmt.Sprintf("https://management.azure.com/subscriptions/%s/resourceGroups/%s/providers/Microsoft.ContainerInstance/containerGroups/%s?api-version=2018-04-01")

	// var proxy http.Handler
	// url := fmt.Sprintf("%s/admin/orders/count.json?access_token=%s&custom=%s", sd.Domain, sd.Token, customparam)

	// Base API request URL: https://management.azure.com
	// Examples
	// Get subscriptions: GET https://management.azure.com/subscriptions?api-version=2016-06-01
	// Get resource groups: GET https://management.azure.com/subscriptions/{subscriptionId}/resourcegroups?api-version=2018-02-01
	// Get locations: GET https://management.azure.com/subscriptions/{subscriptionId}/locations?api-version=2016-06-01
	// Create/update container group: PUT https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ContainerInstance/containerGroups/{containerGroupName}?api-version=2018-04-01

	request.Header.Set("Authorization", "Bearer "+token)

	return transport.httpsRoundTripper.RoundTrip(request)
}
