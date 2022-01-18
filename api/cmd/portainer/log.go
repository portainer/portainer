package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/sirupsen/logrus"
)

type portainerFormatter struct {
	logrus.TextFormatter
}

func (f *portainerFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	var levelColor int
	switch entry.Level {
	case logrus.DebugLevel, logrus.TraceLevel:
		levelColor = 31 // gray
	case logrus.WarnLevel:
		levelColor = 33 // yellow
	case logrus.ErrorLevel, logrus.FatalLevel, logrus.PanicLevel:
		levelColor = 31 // red
	default:
		levelColor = 36 // blue
	}
	return []byte(fmt.Sprintf("\x1b[%dm%s\x1b[0m %s %s\n", levelColor, strings.ToUpper(entry.Level.String()), entry.Time.Format(f.TimestampFormat), entry.Message)), nil
}

func configureLogger() {
	logger := logrus.New() // logger is to implicitly substitute stdlib's log
	log.SetOutput(logger.Writer())

	formatter := &logrus.TextFormatter{DisableTimestamp: true, DisableLevelTruncation: true}
	formatterLogrus := &portainerFormatter{logrus.TextFormatter{DisableTimestamp: false, DisableLevelTruncation: true, TimestampFormat: "2006/01/02 15:04:05", FullTimestamp: true}}

	logger.SetFormatter(formatter)
	logrus.SetFormatter(formatterLogrus)

	logger.SetLevel(logrus.DebugLevel)
	logrus.SetLevel(logrus.DebugLevel)
}
