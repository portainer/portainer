package kubernetes

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/pkg/errors"
	useractivityhttp "github.com/portainer/portainer/api/http/useractivity"
	"github.com/portainer/portainer/api/http/utils"
	"github.com/portainer/portainer/api/useractivity"
)

func (transport *baseTransport) proxySecretsRequest(request *http.Request, requestPath string) (*http.Response, error) {
	switch {
	case request.Method == "POST" || request.Method == "PUT": // create or update
		return transport.decorateSecretsWriteOperation(request)
	default:
		return transport.executeKubernetesRequest(request, true)
	}
}

func (transport *baseTransport) decorateSecretsWriteOperation(request *http.Request) (*http.Response, error) {
	body, err := utils.CopyBody(request)
	if err != nil {
		return nil, err
	}

	response, err := transport.executeKubernetesRequest(request, false)

	if err == nil && (200 <= response.StatusCode && response.StatusCode < 300) {
		transport.logCreateSecretsOperation(request, body)
	}

	return response, err
}

func (transport *baseTransport) logCreateSecretsOperation(request *http.Request, body []byte) {
	cleanBody, err := hideSecretsInfo(body)
	if err != nil {
		log.Printf("[ERROR] [http,docker,config] [message: failed cleaning request body] [error: %s]", err)
		return
	}

	useractivityhttp.LogHttpActivity(transport.userActivityStore, transport.endpoint.Name, request, cleanBody)
}

// hideSecretsInfo removes the confidential properties from the secret payload and returns the new payload
// it will read the request body and recreate it
func hideSecretsInfo(body []byte) (interface{}, error) {
	type requestPayload struct {
		Metadata   interface{}       `json:"metadata"`
		Data       map[string]string `json:"data"`
		StringData map[string]string `json:"stringData"`
		Type       string            `json:"type"`
	}

	var payload requestPayload
	err := json.Unmarshal(body, &payload)
	if err != nil {
		return nil, errors.Wrap(err, "failed parsing body")
	}

	for key := range payload.Data {
		payload.Data[key] = useractivity.RedactedValue
	}

	for key := range payload.StringData {
		payload.StringData[key] = useractivity.RedactedValue
	}

	return payload, nil
}
