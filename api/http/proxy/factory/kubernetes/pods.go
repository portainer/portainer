package kubernetes

import (
	"net/http"
	"strings"

	"github.com/rs/zerolog/log"
)

func (transport *baseTransport) proxyPodsRequest(request *http.Request, namespace string) (*http.Response, error) {
	if request.Method == http.MethodDelete {
		if err := transport.refreshRegistry(request, namespace); err != nil {
			log.Warn().Err(err).Msg("failed to refresh registry credentials")
		}
	}

	if request.Method == http.MethodPost && strings.Contains(request.URL.Path, "/exec") {
		if err := transport.addTokenForExec(request); err != nil {
			return nil, err
		}
	}
	return transport.executeKubernetesRequest(request)
}
