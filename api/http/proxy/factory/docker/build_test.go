package docker

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestBuildOperationRemovesSpilledMultipartFilesOnSuccess(t *testing.T) {
	tempDir := t.TempDir()
	// ParseMultipartForm spills file parts larger than its memory threshold to a temp file
	// created via os.CreateTemp("", "multipart-"), which resolves through os.TempDir(); pointing
	// TMPDIR at an empty per-test directory lets the test observe exactly what buildOperation left behind.
	t.Setenv("TMPDIR", tempDir)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	part, err := writer.CreateFormFile("Dockerfile", "blob")
	require.NoError(t, err)

	// exceeds the 32*OneMegabyte in-memory threshold in buildOperation, forcing the multipart
	// parser to spill this part to a temporary file on disk instead of keeping it in memory.
	content := bytes.Repeat([]byte("a"), 33*1024*1024)
	_, err = part.Write(content)
	require.NoError(t, err)

	require.NoError(t, writer.Close())

	request := httptest.NewRequest(http.MethodPost, "/build", &body)
	request.Header.Set("Content-Type", writer.FormDataContentType())

	err = buildOperation(request)
	require.NoError(t, err)

	entries, err := os.ReadDir(tempDir)
	require.NoError(t, err)
	require.Empty(t, entries, "buildOperation should remove temporary multipart files it caused to be created")
}
