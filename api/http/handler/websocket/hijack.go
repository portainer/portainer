package websocket

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httputil"

	"github.com/gorilla/websocket"
	"github.com/portainer/portainer/api/internal/logoutcontext"
)

func hijackRequest(
	websocketConn *websocket.Conn,
	httpConn *httputil.ClientConn,
	request *http.Request,
	token string,
) error {
	// Server hijacks the connection, error 'connection closed' expected
	resp, err := httpConn.Do(request)
	if !errors.Is(err, httputil.ErrPersistEOF) {
		if err != nil {
			return err
		}
		if resp.StatusCode != http.StatusSwitchingProtocols {
			resp.Body.Close()
			return fmt.Errorf("unable to upgrade to tcp, received %d", resp.StatusCode)
		}
	}

	tcpConn, brw := httpConn.Hijack()
	defer tcpConn.Close()

	errorChan := make(chan error, 1)
	go streamFromReaderToWebsocket(websocketConn, brw, errorChan)
	go streamFromWebsocketToWriter(websocketConn, tcpConn, errorChan)

	logoutCtx := logoutcontext.GetContext(token)

	select {
	case <-logoutCtx.Done():
		return fmt.Errorf("Your session has been logged out.")
	case err = <-errorChan:
		if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
			return err
		}
	}

	return nil
}
