package kubernetes

import (
	"net/http"

	"github.com/rs/zerolog/log"
)

func (transport *baseTransport) proxyDeploymentsRequest(request *http.Request, namespace, requestPath string) (*http.Response, error) {
	switch request.Method {
	case http.MethodPost, http.MethodPatch, http.MethodPut:
		if err := transport.refreshRegistry(request, namespace); err != nil {
			log.Warn().Err(err).Msg("failed to refresh registry credentials")
		}
	}

	return transport.executeKubernetesRequest(request)
}
