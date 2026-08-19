package middlewares

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/require"
)

func TestWithPanicLoggerRecoversAndLogsRegularPanic(t *testing.T) {
	t.Parallel()
	buf := &bytes.Buffer{}
	log.Logger = zerolog.New(buf)

	handler := WithPanicLogger(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("boom")
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	require.Contains(t, buf.String(), "Panic in request handler")
	require.Contains(t, buf.String(), "boom")
}

func TestWithPanicLoggerRePanicsErrAbortHandler(t *testing.T) {
	t.Parallel()
	buf := &bytes.Buffer{}
	log.Logger = zerolog.New(buf)

	handler := WithPanicLogger(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic(http.ErrAbortHandler)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	rec := httptest.NewRecorder()

	var recovered any
	func() {
		defer func() {
			recovered = recover()
		}()

		handler.ServeHTTP(rec, req)
	}()

	require.Equal(t, http.ErrAbortHandler, recovered)
	require.Empty(t, buf.String())
}
