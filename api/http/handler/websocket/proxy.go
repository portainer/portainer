package websocket

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/url"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/logoutcontext"

	"github.com/gorilla/websocket"
	"github.com/koding/websocketproxy"
	"github.com/portainer/portainer/api/crypto"
	"github.com/rs/zerolog/log"
)

func (handler *Handler) proxyEdgeAgentWebsocketRequest(w http.ResponseWriter, r *http.Request, params *webSocketRequestParams) error {
	tunnel, err := handler.ReverseTunnelService.GetActiveTunnel(params.endpoint)
	if err != nil {
		return err
	}

	agentURL, err := url.Parse(fmt.Sprintf("http://127.0.0.1:%d", tunnel.Port))
	if err != nil {
		return err
	}

	return handler.doProxyWebsocketRequest(w, r, params, agentURL, true)
}

func (handler *Handler) proxyAgentWebsocketRequest(w http.ResponseWriter, r *http.Request, params *webSocketRequestParams) error {
	endpointURL := params.endpoint.URL
	if params.endpoint.Type == portainer.AgentOnKubernetesEnvironment {
		endpointURL = fmt.Sprintf("http://%s", params.endpoint.URL)
	}

	agentURL, err := url.Parse(endpointURL)
	if err != nil {
		return err
	}

	agentURL.Scheme = "ws"
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
		tlsConfig := crypto.CreateTLSConfiguration()
		tlsConfig.InsecureSkipVerify = params.endpoint.TLSConfig.TLSSkipVerify

		proxyDialer.TLSClientConfig = tlsConfig
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
		handler.ReverseTunnelService.SetTunnelStatusToActive(params.endpoint.ID)
		handler.ReverseTunnelService.KeepTunnelAlive(params.endpoint.ID, r.Context(), portainer.WebSocketKeepAlive)
	}

	abortProxyOnLogout(r.Context(), proxy, tokenData.Token)

	proxy.ServeHTTP(w, r)

	return nil
}

func abortProxyOnLogout(ctx context.Context, proxy *websocketproxy.WebsocketProxy, token string) {
	var wsConn net.Conn

	proxy.Dialer.NetDial = func(network, addr string) (net.Conn, error) {
		netDialer := &net.Dialer{}

		conn, err := netDialer.DialContext(context.Background(), network, addr)
		wsConn = conn

		return conn, err
	}

	logoutCtx := logoutcontext.GetContext(token)

	go func() {
		log.Debug().
			Msg("logout watcher for websocket proxy started")

		select {
		case <-logoutCtx.Done():
			log.Debug().
				Msg("logout watcher for websocket proxy stopped as user logged out")
			if wsConn != nil {
				wsConn.Close()
			}
		case <-ctx.Done():
			log.Debug().
				Msg("logout watcher for websocket proxy stopped as the ws connection closed")
		}
	}()
}
