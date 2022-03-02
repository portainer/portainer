package main

import (
	"github.com/sirupsen/logrus"
	"log"
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
