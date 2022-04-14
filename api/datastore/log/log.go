package log

import (
	"fmt"
	"log"
)

const (
	INFO  = "INFO"
	ERROR = "ERROR"
	DEBUG = "DEBUG"
	FATAL = "FATAL"
)

type ScopedLog struct {
	scope string
}

func NewScopedLog(scope string) *ScopedLog {
	return &ScopedLog{scope: scope}
}

func (slog *ScopedLog) print(kind string, message string) {
	log.Printf("[%s] [%s] %s", kind, slog.scope, message)
}

func (slog *ScopedLog) Debug(message string) {
	slog.print(DEBUG, fmt.Sprintf("[message: %s]", message))
}

func (slog *ScopedLog) Debugf(message string, vars ...interface{}) {
	message = fmt.Sprintf(message, vars...)
	slog.print(DEBUG, fmt.Sprintf("[message: %s]", message))
}

func (slog *ScopedLog) Info(message string) {
	slog.print(INFO, fmt.Sprintf("[message: %s]", message))
}

func (slog *ScopedLog) Infof(message string, vars ...interface{}) {
	message = fmt.Sprintf(message, vars...)
	slog.print(INFO, fmt.Sprintf("[message: %s]", message))
}

func (slog *ScopedLog) Error(message string, err error) {
	slog.print(ERROR, fmt.Sprintf("[message: %s] [error: %s]", message, err))
}

func (slog *ScopedLog) NotImplemented(method string) {
	log.Fatalf("[%s] [%s] [%s]", FATAL, slog.scope, fmt.Sprintf("%s is not yet implemented", method))
}
