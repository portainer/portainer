package main

import (
	"log"

	"github.com/sirupsen/logrus"
)

func configureLogger() {
	logger := logrus.New() // logger is to implicitly substitute stdlib's log
	log.SetOutput(logger.Writer())

	formatter := &logrus.TextFormatter{DisableTimestamp: false, DisableLevelTruncation: true}

	logger.SetFormatter(formatter)
	logrus.SetFormatter(formatter)

	logger.SetLevel(logrus.DebugLevel)
	logrus.SetLevel(logrus.DebugLevel)
}
