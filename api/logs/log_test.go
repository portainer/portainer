package logs

import (
	"errors"
	"testing"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/stretchr/testify/require"
)

func saveGlobalLevel(t *testing.T) {
	t.Helper()
	orig := zerolog.GlobalLevel()
	t.Cleanup(func() { zerolog.SetGlobalLevel(orig) })
}

func saveLogger(t *testing.T) {
	t.Helper()
	orig := log.Logger
	t.Cleanup(func() { log.Logger = orig })
}

func TestSetLoggingLevel_Error(t *testing.T) {
	saveGlobalLevel(t)

	SetLoggingLevel("ERROR")
	require.Equal(t, zerolog.ErrorLevel, zerolog.GlobalLevel())
}

func TestSetLoggingLevel_Warn(t *testing.T) {
	saveGlobalLevel(t)

	SetLoggingLevel("WARN")
	require.Equal(t, zerolog.WarnLevel, zerolog.GlobalLevel())
}

func TestSetLoggingLevel_Info(t *testing.T) {
	saveGlobalLevel(t)

	SetLoggingLevel("INFO")
	require.Equal(t, zerolog.InfoLevel, zerolog.GlobalLevel())
}

func TestSetLoggingLevel_Debug(t *testing.T) {
	saveGlobalLevel(t)

	SetLoggingLevel("DEBUG")
	require.Equal(t, zerolog.DebugLevel, zerolog.GlobalLevel())
}

func TestSetLoggingLevel_UnknownLevelIsNoop(t *testing.T) {
	saveGlobalLevel(t)

	zerolog.SetGlobalLevel(zerolog.InfoLevel)
	SetLoggingLevel("TRACE")
	require.Equal(t, zerolog.InfoLevel, zerolog.GlobalLevel())
}

func TestSetLoggingMode_Pretty(t *testing.T) {
	saveLogger(t)

	SetLoggingMode("PRETTY")
}

func TestSetLoggingMode_Nocolor(t *testing.T) {
	saveLogger(t)

	SetLoggingMode("NOCOLOR")
}

func TestSetLoggingMode_JSON(t *testing.T) {
	saveLogger(t)

	SetLoggingMode("JSON")
}

func TestSetLoggingMode_UnknownModeIsNoop(t *testing.T) {
	saveLogger(t)

	SetLoggingMode("UNKNOWN")
}

func TestFormatMessage_NonNil(t *testing.T) {
	t.Parallel()

	require.Equal(t, "hello |", formatMessage("hello"))
}

func TestFormatMessage_Nil(t *testing.T) {
	t.Parallel()

	require.Empty(t, formatMessage(nil))
}

type stubCloser struct{ err error }

func (s *stubCloser) Close() error { return s.err }

func TestCloseAndLogErr_Success(t *testing.T) {
	t.Parallel()

	CloseAndLogErr(&stubCloser{err: nil})
}

func TestCloseAndLogErr_Error(t *testing.T) {
	t.Parallel()

	CloseAndLogErr(&stubCloser{err: errors.New("close failed")})
}
