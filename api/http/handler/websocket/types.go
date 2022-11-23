package websocket

import portainer "github.com/portainer/portainer/api"

type webSocketRequestParams struct {
	ID       string
	nodeName string
	endpoint *portainer.Endpoint
	token    string
}
