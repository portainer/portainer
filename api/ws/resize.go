package ws

import (
	"github.com/segmentio/encoding/json"

	"github.com/gorilla/websocket"
)

// SizeQueue is implemented by types that accept terminal resize events.
type SizeQueue interface {
	Push(cols, rows uint16)
}

// ResizeHandler returns a MessageHandler that intercepts terminal resize messages
// and forwards them to the given SizeQueue.
// Resize messages are JSON text frames: {"type":"resize","data":{"width":N,"height":N}}.
func ResizeHandler(q SizeQueue) MessageHandler {
	return func(messageType int, data []byte) bool {
		if messageType != websocket.TextMessage {
			return false
		}
		var msg struct {
			Type string `json:"type"`
			Data struct {
				Width  uint16 `json:"width"`
				Height uint16 `json:"height"`
			} `json:"data"`
		}
		if err := json.Unmarshal(data, &msg); err != nil || msg.Type != "resize" {
			return false
		}
		q.Push(msg.Data.Width, msg.Data.Height)
		return true
	}
}
