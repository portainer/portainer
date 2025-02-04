package compose

import (
	"strings"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// LogrusToZerologWriter is a custom logrus writer that writes logrus logs to zerolog.
// logrus is the logging library used by Docker Compose.
type LogrusToZerologWriter struct{}

func (ltzw *LogrusToZerologWriter) Write(p []byte) (n int, err error) {
	logMessage := string(p)
	logMessage = strings.TrimSuffix(logMessage, "\n")

	// Parse the log level and message from the logrus log.
	// This assumes logrus's default text format.
	var level, message string
	if strings.HasPrefix(logMessage, "time=") {
		// Example logrus log: `time="2023-10-01T12:34:56Z" level=info msg="This is a log message" key=value`
		parts := strings.SplitN(logMessage, " ", 4)
		if len(parts) >= 3 {
			level = strings.TrimPrefix(parts[1], "level=")
			message = strings.TrimPrefix(parts[2], "msg=")
			message = strings.Trim(message, `"`)
		}
	} else {
		// Fallback for simpler log formats.
		level = "info"
		message = logMessage
	}

	// Map logrus levels to zerolog levels.
	var zlogLevel zerolog.Level
	switch level {
	case "debug":
		zlogLevel = zerolog.DebugLevel
	case "info":
		zlogLevel = zerolog.InfoLevel
	case "warn", "warning":
		zlogLevel = zerolog.WarnLevel
	case "error":
		zlogLevel = zerolog.ErrorLevel
	case "fatal":
		zlogLevel = zerolog.FatalLevel
	case "panic":
		zlogLevel = zerolog.PanicLevel
	default:
		zlogLevel = zerolog.InfoLevel
	}

	// Log the message using zerolog.
	log.WithLevel(zlogLevel).Msg(message)

	return len(p), nil
}
