package websocket

import (
	"fmt"
	"net/http"
	"net/http/httputil"

	"github.com/gorilla/websocket"
)

func hijackRequest(websocketConn *websocket.Conn, httpConn *httputil.ClientConn, request *http.Request) error {
	// Server hijacks the connection, error 'connection closed' expected
	resp, err := httpConn.Do(request)
	if err != httputil.ErrPersistEOF {
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

	err = <-errorChan
	if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
		return err
	}

	return nil
}
