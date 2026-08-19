package ws

import (
	"bytes"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"unicode/utf8"

	"github.com/portainer/portainer/api/logs"

	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var testUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// newTestWSPair creates an httptest server, upgrades one connection to websocket,
// and dials a client connection. Returns (server, client) connections
func newTestWSPair(t *testing.T) (*websocket.Conn, *websocket.Conn) {
	t.Helper()

	connCh := make(chan *websocket.Conn, 1)
	doneCh := make(chan struct{})

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := testUpgrader.Upgrade(w, r, nil)
		if !assert.NoError(t, err) {
			return
		}

		connCh <- conn
		<-doneCh
	}))

	t.Cleanup(func() {
		close(doneCh)
		srv.Close()
	})

	u := "ws" + strings.TrimPrefix(srv.URL, "http")

	client, resp, err := websocket.DefaultDialer.Dial(u, nil)
	require.NoError(t, err)

	t.Cleanup(func() { logs.CloseAndLogErr(resp.Body) })

	t.Cleanup(func() {
		err := client.Close()
		require.NoError(t, err)
	})

	server := <-connCh
	t.Cleanup(func() {
		err := server.Close()
		require.NoError(t, err)
	})

	return server, client
}

type failWriter struct {
	err error
}

func (w *failWriter) Write(_ []byte) (int, error) {
	return 0, w.err
}

type failReader struct {
	err error
}

func (r *failReader) Read(_ []byte) (int, error) {
	return 0, r.err
}

func TestValidString(t *testing.T) {
	t.Parallel()

	f := func(input, expected string) {
		t.Helper()
		result := ValidString(input)
		require.Equal(t, expected, result)
		require.True(t, utf8.ValidString(result))
	}

	f("hello world", "hello world")
	// \xff and \xfe are invalid UTF-8 bytes and must be stripped
	f("hello\xff\xfeworld", "helloworld")
	f("", "")
}

func TestStreamFromWebsocketToWriter_ForwardsMessages(t *testing.T) {
	t.Parallel()

	serverConn, clientConn := newTestWSPair(t)

	var buf bytes.Buffer
	errorChan := make(chan error, 1)

	go StreamFromWebsocketToWriter(serverConn, &buf, errorChan)

	err := clientConn.WriteMessage(websocket.TextMessage, []byte("hello"))
	require.NoError(t, err)

	err = clientConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	require.NoError(t, err)

	// The goroutine sends to errorChan after processing all prior messages,
	// so buf is fully written by the time we receive here
	err = <-errorChan
	require.Error(t, err)

	require.Equal(t, "hello", buf.String())
}

func TestStreamFromWebsocketToWriter_HandlerInterceptsMessage(t *testing.T) {
	t.Parallel()

	serverConn, clientConn := newTestWSPair(t)

	var buf bytes.Buffer
	errorChan := make(chan error, 1)

	intercepted := false
	handler := MessageHandler(func(_ int, data []byte) bool {
		if string(data) == "intercept" {
			intercepted = true

			return true
		}

		return false
	})

	go StreamFromWebsocketToWriter(serverConn, &buf, errorChan, handler)

	err := clientConn.WriteMessage(websocket.TextMessage, []byte("intercept"))
	require.NoError(t, err)

	err = clientConn.WriteMessage(websocket.TextMessage, []byte("forward"))
	require.NoError(t, err)

	err = clientConn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	require.NoError(t, err)

	err = <-errorChan
	require.Error(t, err)

	require.True(t, intercepted)
	require.Equal(t, "forward", buf.String())
}

func TestStreamFromWebsocketToWriter_WriteError(t *testing.T) {
	t.Parallel()

	serverConn, clientConn := newTestWSPair(t)

	expectedErr := errors.New("write error")
	errorChan := make(chan error, 1)

	go StreamFromWebsocketToWriter(serverConn, &failWriter{err: expectedErr}, errorChan)

	err := clientConn.WriteMessage(websocket.TextMessage, []byte("trigger"))
	require.NoError(t, err)

	err = <-errorChan
	require.ErrorIs(t, err, expectedErr)
}

func TestStreamFromReaderToWebsocket_ForwardsData(t *testing.T) {
	t.Parallel()

	serverConn, clientConn := newTestWSPair(t)

	reader := strings.NewReader("hello world")
	errorChan := make(chan error, 1)

	go StreamFromReaderToWebsocket(serverConn, reader, errorChan)

	msgType, msg, err := clientConn.ReadMessage()
	require.NoError(t, err)
	require.Equal(t, websocket.TextMessage, msgType)
	require.Equal(t, "hello world", string(msg))

	err = <-errorChan
	require.ErrorIs(t, err, io.EOF)
}

func TestStreamFromReaderToWebsocket_ReadError(t *testing.T) {
	t.Parallel()

	serverConn, _ := newTestWSPair(t)

	expectedErr := errors.New("read error")
	errorChan := make(chan error, 1)

	go StreamFromReaderToWebsocket(serverConn, &failReader{err: expectedErr}, errorChan)

	err := <-errorChan
	require.ErrorIs(t, err, expectedErr)
}

func TestWriteReaderToWebSocket_ForwardsData(t *testing.T) {
	t.Parallel()

	serverConn, clientConn := newTestWSPair(t)

	var mu sync.Mutex
	reader := strings.NewReader("hello")
	errorChan := make(chan error, 2)

	go WriteReaderToWebSocket(serverConn, &mu, reader, errorChan)

	msgType, msg, err := clientConn.ReadMessage()
	require.NoError(t, err)
	require.Equal(t, websocket.TextMessage, msgType)
	require.Equal(t, "hello", string(msg))

	// The inner goroutine sends EOF after the reader is exhausted
	err = <-errorChan
	require.ErrorIs(t, err, io.EOF)
}

func TestWriteReaderToWebSocket_ReaderError(t *testing.T) {
	t.Parallel()

	serverConn, _ := newTestWSPair(t)

	var mu sync.Mutex
	expectedErr := errors.New("read error")
	errorChan := make(chan error, 2)

	go WriteReaderToWebSocket(serverConn, &mu, &failReader{err: expectedErr}, errorChan)

	err := <-errorChan
	require.ErrorIs(t, err, expectedErr)
}

// newTestWSConn creates a websocket server connection without registering a close cleanup
// for it, allowing the caller to close it manually without triggering a double-close
func newTestWSConn(t *testing.T) *websocket.Conn {
	t.Helper()

	connCh := make(chan *websocket.Conn, 1)
	doneCh := make(chan struct{})

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := testUpgrader.Upgrade(w, r, nil)
		if !assert.NoError(t, err) {
			return
		}

		connCh <- conn
		<-doneCh
	}))

	t.Cleanup(func() {
		close(doneCh)
		srv.Close()
	})

	u := "ws" + strings.TrimPrefix(srv.URL, "http")

	client, resp, err := websocket.DefaultDialer.Dial(u, nil)
	require.NoError(t, err)

	t.Cleanup(func() { logs.CloseAndLogErr(resp.Body) })

	t.Cleanup(func() { logs.CloseAndLogErr(client) })

	return <-connCh
}

type mockSizeQueue struct {
	cols uint16
	rows uint16
}

func (m *mockSizeQueue) Push(cols, rows uint16) {
	m.cols = cols
	m.rows = rows
}

func TestResizeHandler(t *testing.T) {
	t.Parallel()

	f := func(msgType int, data []byte, expectedHandled bool, expectedCols, expectedRows uint16) {
		t.Helper()
		q := &mockSizeQueue{}
		handled := ResizeHandler(q)(msgType, data)
		require.Equal(t, expectedHandled, handled)
		require.Equal(t, expectedCols, q.cols)
		require.Equal(t, expectedRows, q.rows)
	}

	f(websocket.BinaryMessage, []byte(`{"type":"resize","data":{"width":80,"height":24}}`), false, 0, 0)
	f(websocket.TextMessage, []byte(`not json`), false, 0, 0)
	f(websocket.TextMessage, []byte(`{"type":"other","data":{"width":80,"height":24}}`), false, 0, 0)
	f(websocket.TextMessage, []byte(`{"type":"resize","data":{"width":80,"height":24}}`), true, 80, 24)
}

func TestWsPing_Success(t *testing.T) {
	t.Parallel()

	serverConn, _ := newTestWSPair(t)

	var mu sync.Mutex
	err := wsPing(serverConn, &mu)
	require.NoError(t, err)
}

func TestWsPing_ClosedConnection(t *testing.T) {
	t.Parallel()

	serverConn := newTestWSConn(t)

	err := serverConn.Close()
	require.NoError(t, err)

	var mu sync.Mutex
	err = wsPing(serverConn, &mu)
	require.Error(t, err)
}

func TestWsWrite_ClosedConnection(t *testing.T) {
	t.Parallel()

	serverConn := newTestWSConn(t)

	err := serverConn.Close()
	require.NoError(t, err)

	var mu sync.Mutex
	err = wsWrite(serverConn, &mu, "hello")
	require.Error(t, err)
}

func TestWriteReaderToWebSocket_ClosedConnection(t *testing.T) {
	t.Parallel()

	serverConn := newTestWSConn(t)

	err := serverConn.Close()
	require.NoError(t, err)

	var mu sync.Mutex
	errorChan := make(chan error, 2)
	go WriteReaderToWebSocket(serverConn, &mu, strings.NewReader("hello"), errorChan)

	err = <-errorChan
	require.Error(t, err)
}

func TestStreamFromReaderToWebsocket_ClosedConnection(t *testing.T) {
	t.Parallel()

	serverConn := newTestWSConn(t)

	err := serverConn.Close()
	require.NoError(t, err)

	errorChan := make(chan error, 1)
	go StreamFromReaderToWebsocket(serverConn, strings.NewReader("hello"), errorChan)

	err = <-errorChan
	require.Error(t, err)
}

func TestHijackRequest_UnexpectedStatus(t *testing.T) {
	t.Parallel()

	serverConn, _ := newTestWSPair(t)

	backendServer, backendClient := net.Pipe()
	defer logs.CloseAndLogErr(backendServer)
	defer logs.CloseAndLogErr(backendClient)

	go func() {
		buf := make([]byte, 4096)
		if _, err := backendServer.Read(buf); err != nil {
			return
		}

		resp := "HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\n\r\n"
		if _, err := backendServer.Write([]byte(resp)); err != nil {
			return
		}
	}()

	req, err := http.NewRequestWithContext(t.Context(), http.MethodGet, "http://backend/", nil)
	require.NoError(t, err)

	err = HijackRequest(serverConn, backendClient, req)
	require.ErrorContains(t, err, "403")
}

func TestHijackRequest_Success(t *testing.T) {
	t.Parallel()

	serverConn, _ := newTestWSPair(t)

	backendServer, backendClient := net.Pipe()
	defer logs.CloseAndLogErr(backendClient)

	go func() {
		defer logs.CloseAndLogErr(backendServer)

		buf := make([]byte, 4096)
		if _, err := backendServer.Read(buf); err != nil {
			return
		}

		resp := "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n"
		if _, err := backendServer.Write([]byte(resp)); err != nil {
			return
		}
	}()

	req, err := http.NewRequestWithContext(t.Context(), http.MethodGet, "http://backend/", nil)
	require.NoError(t, err)

	// The backend closes after sending 101, which delivers EOF to the reader goroutine.
	// HijackRequest treats EOF (not a CloseError) as a clean session end and returns nil.
	err = HijackRequest(serverConn, backendClient, req)
	require.NoError(t, err)
}
