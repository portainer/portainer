package websocket

import (
	"io"
	"unicode/utf8"

	"github.com/gorilla/websocket"
)

const readerBufferSize = 2048

func streamFromWebsocketToWriter(websocketConn *websocket.Conn, writer io.Writer, errorChan chan error) {
	for {
		_, in, err := websocketConn.ReadMessage()
		if err != nil {
			errorChan <- err
			break
		}

		_, err = writer.Write(in)
		if err != nil {
			errorChan <- err
			break
		}
	}
}

func streamFromReaderToWebsocket(websocketConn *websocket.Conn, reader io.Reader, errorChan chan error) {
	for {
		out := make([]byte, readerBufferSize)
		_, err := reader.Read(out)
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
