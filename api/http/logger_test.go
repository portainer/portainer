package http

import (
	"bytes"
	"testing"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/require"
)

func TestLogger(t *testing.T) {
	msg := "Testing HTTP logger"
	buf := &bytes.Buffer{}

	original := log.Logger
	t.Cleanup(func() { log.Logger = original })
	log.Logger = zerolog.New(buf)

	NewHTTPLogger().Print(msg)

	require.Contains(t, buf.String(), msg)
}
