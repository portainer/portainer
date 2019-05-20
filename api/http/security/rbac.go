package security

import (
	"encoding/json"
	"net/http"
	"time"

	portainer "github.com/portainer/portainer/api"
)

const (
	defaultHTTPTimeout = 5
)

type rbacExtensionClient struct {
	httpClient   *http.Client
	extensionURL string
	licenseKey   string
}

func newRBACExtensionClient(extensionURL string) *rbacExtensionClient {
	return &rbacExtensionClient{
		extensionURL: extensionURL,
		httpClient: &http.Client{
			Timeout: time.Second * time.Duration(defaultHTTPTimeout),
		},
	}
}

func (client *rbacExtensionClient) setLicenseKey(licenseKey string) {
	client.licenseKey = licenseKey
}

func (client *rbacExtensionClient) checkAuthorization(authRequest *portainer.APIOperationAuthorizationRequest) error {
	encodedAuthRequest, err := json.Marshal(authRequest)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("GET", client.extensionURL+"/authorized_operation", nil)
	if err != nil {
		return err
	}

	req.Header.Set("X-RBAC-AuthorizationRequest", string(encodedAuthRequest))
	req.Header.Set("X-PortainerExtension-License", client.licenseKey)

	resp, err := client.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return portainer.ErrAuthorizationRequired
	}

	return nil
}
