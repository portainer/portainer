package proxy

import (
	"crypto/tls"
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type agentTransport struct {
	httpTransport    *http.Transport
	signatureService portainer.DigitalSignatureService
}

func NewAgentTransport(signatureService portainer.DigitalSignatureService, tlsConfig *tls.Config) *agentTransport {
	return &agentTransport{
		httpTransport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
		signatureService: signatureService,
	}
}

func (p *agentTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	signature, err := p.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	request.Header.Set(portainer.PortainerAgentPublicKeyHeader, p.signatureService.EncodedPublicKey())
	request.Header.Set(portainer.PortainerAgentSignatureHeader, signature)

	return p.httpTransport.RoundTrip(request)
}
