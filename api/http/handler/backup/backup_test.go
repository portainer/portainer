package backup

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/portainer/portainer/api/adminmonitor"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/offlinegate"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/pkg/fips"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// prepareFilestorePath copies the test assets to an isolated temp dir so
// parallel tests don't share the same filestorePath and interfere with each other.
func prepareFilestorePath(t *testing.T) string {
	t.Helper()
	tmpDir := t.TempDir()
	err := os.CopyFS(tmpDir, os.DirFS("./test_assets/handler_test"))
	require.NoError(t, err)

	return tmpDir
}

func init() {
	fips.InitFIPS(false)
}

func listFiles(t *testing.T, dir string) []string {
	items := make([]string, 0)

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if path == dir {
			return nil
		}
		items = append(items, path)

		return nil
	})
	require.NoError(t, err)

	return items
}

func contains(t *testing.T, list []string, path string) {
	assert.Contains(t, list, path)
	copyContent, err := os.ReadFile(path)
	require.NoError(t, err)

	assert.Equal(t, "content\n", string(copyContent))
}

func Test_backupHandlerWithoutPassword_shouldCreateATarballArchive(t *testing.T) {
	t.Parallel()
	r := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"password":""}`))
	w := httptest.NewRecorder()

	gate := offlinegate.NewOfflineGate()
	adminMonitor := adminmonitor.New(time.Hour, nil)

	handlerErr := NewHandler(
		testhelpers.NewTestRequestBouncer(),
		testhelpers.NewDatastore(),
		gate,
		prepareFilestorePath(t),
		func() {},
		adminMonitor).backup(w, r)
	assert.Nil(t, handlerErr, "Handler should not fail")

	response := w.Result()
	body, err := io.ReadAll(response.Body)
	require.NoError(t, err)

	err = response.Body.Close()
	require.NoError(t, err)

	tmpdir := t.TempDir()

	archivePath := filesystem.JoinPaths(tmpdir, "archive.tar.gz")
	if err := os.WriteFile(archivePath, body, 0600); err != nil {
		t.Fatal("Failed to save downloaded .tar.gz archive: ", err)
	}

	cmd := exec.Command("tar", "-xzf", archivePath, "-C", tmpdir)
	if err := cmd.Run(); err != nil {
		t.Fatal("Failed to extract archive: ", err)
	}

	createdFiles := listFiles(t, tmpdir)

	contains(t, createdFiles, filesystem.JoinPaths(tmpdir, "portainer.key"))
	contains(t, createdFiles, filesystem.JoinPaths(tmpdir, "portainer.pub"))
	contains(t, createdFiles, filesystem.JoinPaths(tmpdir, "tls", "file1"))
	contains(t, createdFiles, filesystem.JoinPaths(tmpdir, "tls", "file2"))
	assert.NotContains(t, createdFiles, filesystem.JoinPaths(tmpdir, "extra_file"))
	assert.NotContains(t, createdFiles, filesystem.JoinPaths(tmpdir, "extra_folder", "file1"))
}

func Test_backupHandlerWithPassword_shouldCreateEncryptedATarballArchive(t *testing.T) {
	t.Parallel()
	r := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"password":"secret"}`))
	w := httptest.NewRecorder()

	gate := offlinegate.NewOfflineGate()
	adminMonitor := adminmonitor.New(time.Hour, nil)

	handlerErr := NewHandler(
		testhelpers.NewTestRequestBouncer(),
		testhelpers.NewDatastore(),
		gate,
		prepareFilestorePath(t),
		func() {},
		adminMonitor).backup(w, r)
	assert.Nil(t, handlerErr, "Handler should not fail")

	response := w.Result()
	body, _ := io.ReadAll(response.Body)

	err := response.Body.Close()
	require.NoError(t, err)

	tmpdir := t.TempDir()

	dr, err := crypto.AesDecrypt(bytes.NewReader(body), []byte("secret"))
	if err != nil {
		t.Fatal("Failed to decrypt archive")
	}

	archivePath := filesystem.JoinPaths(tmpdir, "archive.tag.gz")
	archive, err := os.Create(archivePath)
	require.NoError(t, err)

	defer func() {
		err := archive.Close()
		require.NoError(t, err)
	}()

	_, err = io.Copy(archive, dr)
	require.NoError(t, err)

	cmd := exec.Command("tar", "-xzf", archivePath, "-C", tmpdir)
	if err := cmd.Run(); err != nil {
		t.Fatal("Failed to extract archive: ", err)
	}

	createdFiles := listFiles(t, tmpdir)

	contains(t, createdFiles, filesystem.JoinPaths(tmpdir, "portainer.key"))
	contains(t, createdFiles, filesystem.JoinPaths(tmpdir, "portainer.pub"))
	contains(t, createdFiles, filesystem.JoinPaths(tmpdir, "tls", "file1"))
	contains(t, createdFiles, filesystem.JoinPaths(tmpdir, "tls", "file2"))
	assert.NotContains(t, createdFiles, filesystem.JoinPaths(tmpdir, "extra_file"))
	assert.NotContains(t, createdFiles, filesystem.JoinPaths(tmpdir, "extra_folder", "file1"))
}
