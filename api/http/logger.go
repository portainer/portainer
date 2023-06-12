package http

import (
	"log"

	zlog "github.com/rs/zerolog/log"
)

type httpLogger struct{}

func NewHTTPLogger() *log.Logger {
	return log.New(&httpLogger{}, "", 0)
}

func (l *httpLogger) Write(data []byte) (int, error) {
	zlog.Debug().CallerSkipFrame(3).Msg(string(data))

	return len(data), nil
}
