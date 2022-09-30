package main

import (
	stdlog "log"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/rs/zerolog/pkgerrors"
)

func configureLogger() {
	zerolog.ErrorStackFieldName = "stack_trace"
	zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	stdlog.SetFlags(0)
	stdlog.SetOutput(log.Logger)

	log.Logger = log.Logger.With().Caller().Stack().Logger()
}

func setLoggingLevel(level string) {
	switch level {
	case "ERROR":
		zerolog.SetGlobalLevel(zerolog.ErrorLevel)
	case "WARN":
		zerolog.SetGlobalLevel(zerolog.WarnLevel)
	case "INFO":
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	case "DEBUG":
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}
}
