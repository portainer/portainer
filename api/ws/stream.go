package ws

import (
	"io"
	"unicode/utf8"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
)

const ReaderBufferSize = 2048

func StreamFromWebsocketToWriter(websocketConn *websocket.Conn, writer io.Writer, errorChan chan error) {
	for {
		messageType, in, err := websocketConn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
				log.Debug().Err(err).Msg("unexpected close error")
			}
			errorChan <- err

			return
		}

		if messageType != websocket.TextMessage && messageType != websocket.BinaryMessage {
			continue
		}

		if _, err := writer.Write(in); err != nil {
			log.Debug().Err(err).Msg("writing error")
			errorChan <- err

			return
		}
	}
}

func StreamFromReaderToWebsocket(websocketConn *websocket.Conn, reader io.Reader, errorChan chan error) {
	out := make([]byte, ReaderBufferSize)

	for {
		n, err := reader.Read(out)
		if err != nil {
			errorChan <- err

			break
		}

		processedOutput := ValidString(string(out[:n]))
		if err := websocketConn.WriteMessage(websocket.TextMessage, []byte(processedOutput)); err != nil {
			errorChan <- err

			break
		}
	}
}

func ValidString(s string) string {
	if utf8.ValidString(s) {
		return s
	}

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

	return string(v)
}
