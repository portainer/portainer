package websocket

import (
	"net"
	"net/http"
	"net/url"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/logoutcontext"

	"github.com/gorilla/websocket"
	"github.com/koding/websocketproxy"
	"github.com/rs/zerolog/log"
)

func (handler *Handler) proxyEdgeAgentWebsocketRequest(w http.ResponseWriter, r *http.Request, params *webSocketRequestParams) error {
	tunnelAddr, err := handler.ReverseTunnelService.TunnelAddr(params.endpoint)
	if err != nil {
		return err
	}

	agentURL, err := url.Parse("http://" + tunnelAddr)
	if err != nil {
		return err
	}

	return handler.doProxyWebsocketRequest(w, r, params, agentURL, true)
}

func (handler *Handler) proxyAgentWebsocketRequest(w http.ResponseWriter, r *http.Request, params *webSocketRequestParams) error {
	endpointURL := params.endpoint.URL
	if params.endpoint.Type == portainer.AgentOnKubernetesEnvironment {
		endpointURL = "http://" + params.endpoint.URL
	}

	agentURL, err := url.Parse(endpointURL)
	if err != nil {
		return err
	}

	return handler.doProxyWebsocketRequest(w, r, params, agentURL, false)
}

func (handler *Handler) doProxyWebsocketRequest(
	w http.ResponseWriter,
	r *http.Request,
	params *webSocketRequestParams,
	agentURL *url.URL,
	isEdge bool,
) error {
	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		log.
			Warn().
			Err(err).
			Msg("unable to retrieve user details from authentication token")
		return err
	}

	enableTLS := !isEdge && (params.endpoint.TLSConfig.TLS || params.endpoint.TLSConfig.TLSSkipVerify)

	agentURL.Scheme = "ws"
	if enableTLS {
		agentURL.Scheme = "wss"
	}

	proxy := websocketproxy.NewProxy(agentURL)
	proxyDialer := *websocket.DefaultDialer
	proxy.Dialer = &proxyDialer

	if enableTLS {
		proxyDialer.TLSClientConfig = crypto.CreateTLSConfiguration(params.endpoint.TLSConfig.TLSSkipVerify)
	}

	signature, err := handler.SignatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return err
	}

	proxy.Director = func(incoming *http.Request, out http.Header) {
		out.Set(portainer.PortainerAgentPublicKeyHeader, handler.SignatureService.EncodedPublicKey())
		out.Set(portainer.PortainerAgentSignatureHeader, signature)
		out.Set(portainer.PortainerAgentTargetHeader, params.nodeName)
		out.Set(portainer.PortainerAgentKubernetesSATokenHeader, params.token)
	}

	if isEdge {
		handler.ReverseTunnelService.UpdateLastActivity(params.endpoint.ID)
		handler.ReverseTunnelService.KeepTunnelAlive(params.endpoint.ID, r.Context(), portainer.WebSocketKeepAlive)
	}

	proxy.Dialer.NetDial = func(network, addr string) (net.Conn, error) {
		netDialer := &net.Dialer{}

		logoutCtx := logoutcontext.GetContext(tokenData.Token)

		conn, err := netDialer.DialContext(logoutCtx, network, addr)

		return conn, err
	}

	proxy.ServeHTTP(w, r)

	return nil
}
