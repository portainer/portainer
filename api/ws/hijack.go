package ws

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
)

const (
	// Time allowed to write a message to the peer
	WriteWait = 10 * time.Second

	// Send pings to peer with this period
	PingPeriod = 50 * time.Second
)

func HijackRequest(websocketConn *websocket.Conn, conn net.Conn, request *http.Request) error {
	resp, err := sendHTTPRequest(conn, request)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Check if the response status code indicates an upgrade (101 Switching Protocols)
	if resp.StatusCode != http.StatusSwitchingProtocols {
		return fmt.Errorf("unexpected response status code: %d", resp.StatusCode)
	}

	var mu sync.Mutex

	errorChan := make(chan error, 1)
	go StreamFromWebsocketToWriter(websocketConn, conn, errorChan)
	go WriteReaderToWebSocket(websocketConn, &mu, conn, errorChan)

	err = <-errorChan
	if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
		log.Debug().Err(err).Msg("unexpected close error")

		return err
	}

	log.Info().Msg("session ended")

	return nil
}

// sendHTTPRequest sends an HTTP request over the provided net.Conn and parses the response.
func sendHTTPRequest(conn net.Conn, req *http.Request) (*http.Response, error) {
	// Send the HTTP request to the server
	if err := req.Write(conn); err != nil {
		return nil, fmt.Errorf("error writing request: %w", err)
	}

	// Read the response from the server
	resp, err := http.ReadResponse(bufio.NewReader(conn), req)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %w", err)
	}

	return resp, nil
}

func WriteReaderToWebSocket(websocketConn *websocket.Conn, mu *sync.Mutex, reader io.Reader, errorChan chan error) {
	out := make([]byte, ReaderBufferSize)
	input := make(chan string)
	pingTicker := time.NewTicker(PingPeriod)
	defer pingTicker.Stop()
	defer websocketConn.Close()

	mu.Lock()
	websocketConn.SetReadLimit(ReaderBufferSize)
	websocketConn.SetPongHandler(func(string) error {
		return nil
	})

	websocketConn.SetPingHandler(func(data string) error {
		websocketConn.SetWriteDeadline(time.Now().Add(WriteWait))

		return websocketConn.WriteMessage(websocket.PongMessage, []byte(data))
	})
	mu.Unlock()

	go func() {
		for {
			n, err := reader.Read(out)
			if err != nil {
				errorChan <- err

				if !errors.Is(err, io.EOF) {
					log.Debug().Err(err).Msg("error reading from server")
				}

				return
			}

			processedOutput := ValidString(string(out[:n]))
			input <- processedOutput
		}
	}()

	for {
		select {
		case msg := <-input:
			if err := wsWrite(websocketConn, mu, msg); err != nil {
				log.Debug().Err(err).Msg("error writing to websocket")
				errorChan <- err

				return
			}
		case <-pingTicker.C:
			if err := wsPing(websocketConn, mu); err != nil {
				log.Debug().Err(err).Msg("error writing to websocket during pong response")
				errorChan <- err

				return
			}
		}
	}
}

func wsWrite(websocketConn *websocket.Conn, mu *sync.Mutex, msg string) error {
	mu.Lock()
	defer mu.Unlock()

	websocketConn.SetWriteDeadline(time.Now().Add(WriteWait))

	return websocketConn.WriteMessage(websocket.TextMessage, []byte(msg))
}

func wsPing(websocketConn *websocket.Conn, mu *sync.Mutex) error {
	mu.Lock()
	defer mu.Unlock()

	websocketConn.SetWriteDeadline(time.Now().Add(WriteWait))

	return websocketConn.WriteMessage(websocket.PingMessage, nil)
}
