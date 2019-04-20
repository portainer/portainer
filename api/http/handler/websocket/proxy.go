package websocket

import (
	"crypto/tls"
	"github.com/gorilla/websocket"
	"github.com/koding/websocketproxy"
	"net/http"
	"net/url"
	"github.com/portainer/portainer/api"
)

func (handler *Handler) proxyWebsocketRequest(w http.ResponseWriter, r *http.Request, params *webSocketRequestParams) error {
	agentURL, err := url.Parse(params.endpoint.URL)
	if err != nil {
		return err
	}

	agentURL.Scheme = "ws"
	proxy := websocketproxy.NewProxy(agentURL)

	if params.endpoint.TLSConfig.TLS || params.endpoint.TLSConfig.TLSSkipVerify {
		agentURL.Scheme = "wss"
		proxy.Dialer = &websocket.Dialer{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: params.endpoint.TLSConfig.TLSSkipVerify,
			},
		}
	}

	signature, err := handler.SignatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return err
	}

	proxy.Director = func(incoming *http.Request, out http.Header) {
		out.Set(portainer.PortainerAgentPublicKeyHeader, handler.SignatureService.EncodedPublicKey())
		out.Set(portainer.PortainerAgentSignatureHeader, signature)
		out.Set(portainer.PortainerAgentTargetHeader, params.nodeName)
	}

	proxy.ServeHTTP(w, r)

	return nil
}
