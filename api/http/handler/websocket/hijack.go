package websocket

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
	writeWait = 10 * time.Second

	// Send pings to peer with this period
	pingPeriod = 50 * time.Second
)

func hijackRequest(
	websocketConn *websocket.Conn,
	conn net.Conn,
	request *http.Request,
	token string,
) error {
	resp, err := sendHTTPRequest(conn, request)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Check if the response status code indicates an upgrade (101 Switching Protocols)
	if resp.StatusCode != http.StatusSwitchingProtocols {
		return fmt.Errorf("unexpected response status code: %d", resp.StatusCode)
	}

	errorChan := make(chan error, 1)
	go readWebSocketToTCP(websocketConn, conn, errorChan)
	go writeTCPToWebSocket(websocketConn, conn, errorChan)

	err = <-errorChan
	if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
		log.Debug().Msgf("Unexpected close error: %v\n", err)
		return err
	}

	log.Debug().Msgf("session ended")
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

func readWebSocketToTCP(websocketConn *websocket.Conn, tcpConn net.Conn, errorChan chan error) {
	for {
		messageType, p, err := websocketConn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
				log.Debug().Msgf("Unexpected close error: %v\n", err)
			}
			errorChan <- err
			return
		}

		if messageType == websocket.TextMessage || messageType == websocket.BinaryMessage {
			_, err := tcpConn.Write(p)
			if err != nil {
				log.Debug().Msgf("Error writing to TCP connection: %v\n", err)
				errorChan <- err
				return
			}
		}
	}
}

func writeTCPToWebSocket(websocketConn *websocket.Conn, tcpConn net.Conn, errorChan chan error) {
	var mu sync.Mutex
	out := make([]byte, readerBufferSize)
	input := make(chan string)
	pingTicker := time.NewTicker(pingPeriod)
	defer pingTicker.Stop()
	defer websocketConn.Close()

	websocketConn.SetReadLimit(2048)
	websocketConn.SetPongHandler(func(string) error {
		return nil
	})

	websocketConn.SetPingHandler(func(data string) error {
		websocketConn.SetWriteDeadline(time.Now().Add(writeWait))
		return websocketConn.WriteMessage(websocket.PongMessage, []byte(data))
	})

	reader := bufio.NewReader(tcpConn)

	go func() {
		for {
			n, err := reader.Read(out)
			if err != nil {
				errorChan <- err
				if !errors.Is(err, io.EOF) {
					log.Debug().Msgf("error reading from server: %v", err)
				}
				return
			}

			processedOutput := validString(string(out[:n]))
			input <- processedOutput
		}
	}()

	for {
		select {
		case msg := <-input:
			err := wswrite(websocketConn, &mu, msg)
			if err != nil {
				log.Debug().Msgf("error writing to websocket: %v", err)
				errorChan <- err
				return
			}
		case <-pingTicker.C:
			if err := wsping(websocketConn, &mu); err != nil {
				log.Debug().Msgf("error writing to websocket during pong response: %v", err)
				errorChan <- err
				return
			}
		}
	}
}

func wswrite(websocketConn *websocket.Conn, mu *sync.Mutex, msg string) error {
	mu.Lock()
	defer mu.Unlock()

	websocketConn.SetWriteDeadline(time.Now().Add(writeWait))
	return websocketConn.WriteMessage(websocket.TextMessage, []byte(msg))
}

func wsping(websocketConn *websocket.Conn, mu *sync.Mutex) error {
	mu.Lock()
	defer mu.Unlock()

	websocketConn.SetWriteDeadline(time.Now().Add(writeWait))
	return websocketConn.WriteMessage(websocket.PingMessage, nil)
}
