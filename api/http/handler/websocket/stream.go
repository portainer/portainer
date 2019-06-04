package websocket

import (
	"bufio"
	"github.com/gorilla/websocket"
	"net"
	"unicode/utf8"
)

func streamFromWebsocketConnToTCPConn(websocketConn *websocket.Conn, tcpConn net.Conn, errorChan chan error) {
	for {
		_, in, err := websocketConn.ReadMessage()
		if err != nil {
			errorChan <- err
			break
		}

		_, err = tcpConn.Write(in)
		if err != nil {
			errorChan <- err
			break
		}
	}
}

func streamFromTCPConnToWebsocketConn(websocketConn *websocket.Conn, br *bufio.Reader, errorChan chan error) {
	for {
		out := make([]byte, 2048)
		_, err := br.Read(out)
		if err != nil {
			errorChan <- err
			break
		}

		processedOutput := validString(string(out[:]))
		err = websocketConn.WriteMessage(websocket.TextMessage, []byte(processedOutput))
		if err != nil {
			errorChan <- err
			break
		}
	}
}

func validString(s string) string {
	if !utf8.ValidString(s) {
		v := make([]rune, 0, len(s))
		for i, r := range s {
			if r == utf8.RuneError {
				_, size := utf8.DecodeRuneInString(s[i:])
				if size == 1 {
					continue
				}
			}
			v = append(v, r)
		}
		s = string(v)
	}
	return s
}
