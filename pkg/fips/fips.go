package fips

import (
	"crypto/fips140"
	"errors"
	"sync"

	"github.com/rs/zerolog/log"
)

var fipsMode, isInitialised bool

var once sync.Once

var ErrTLSRequired = errors.New("TLS configuration is required in FIPS mode")

func InitFIPS(enabled bool) {
	once.Do(func() {
		isInitialised = true
		fipsMode = enabled

		if enabled && !fips140.Enabled() {
			log.Fatal().Msg("If FIPS mode is enabled then the fips140 GODEBUG environment variable must be set")
		}
	})
}

func FIPSMode() bool {
	if !isInitialised {
		log.Fatal().Msg("Could not determine if FIPS mode is enabled because InitFIPS was never called")
	}

	return fipsMode
}

func CanTLSSkipVerify() bool {
	if !isInitialised {
		log.Fatal().Msg("Could not determine if FIPS mode is enabled because InitFIPS was never called")
	}

	return !fipsMode
}
