package backup

import (
	"bytes"
	"context"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/docker/docker/pkg/ioutils"
	"github.com/portainer/portainer/api/adminmonitor"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/demo"
	"github.com/portainer/portainer/api/http/offlinegate"
	i "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func listFiles(dir string) []string {
	items := make([]string, 0)
	filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if path == dir {
			return nil
		}
		items = append(items, path)
		return nil
	})

	return items
}

func contains(t *testing.T, list []string, path string) {
	assert.Contains(t, list, path)
	copyContent, _ := ioutil.ReadFile(path)
	assert.Equal(t, "content\n", string(copyContent))
}

func Test_backupHandlerWithoutPassword_shouldCreateATarballArchive(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"password":""}`))
	w := httptest.NewRecorder()

	gate := offlinegate.NewOfflineGate()
	adminMonitor := adminmonitor.New(time.Hour, nil, context.Background())

	handlerErr := NewHandler(nil, i.NewDatastore(), gate, "./test_assets/handler_test", func() {}, adminMonitor, &demo.Service{}).backup(w, r)
	assert.Nil(t, handlerErr, "Handler should not fail")

	response := w.Result()
	body, _ := io.ReadAll(response.Body)

	tmpdir, _ := ioutils.TempDir("", "backup")
	defer os.RemoveAll(tmpdir)

	archivePath := filepath.Join(tmpdir, "archive.tar.gz")
	err := ioutil.WriteFile(archivePath, body, 0600)
	if err != nil {
		t.Fatal("Failed to save downloaded .tar.gz archive: ", err)
	}
	cmd := exec.Command("tar", "-xzf", archivePath, "-C", tmpdir)
	err = cmd.Run()
	if err != nil {
		t.Fatal("Failed to extract archive: ", err)
	}

	createdFiles := listFiles(tmpdir)

	contains(t, createdFiles, path.Join(tmpdir, "portainer.key"))
	contains(t, createdFiles, path.Join(tmpdir, "portainer.pub"))
	contains(t, createdFiles, path.Join(tmpdir, "tls", "file1"))
	contains(t, createdFiles, path.Join(tmpdir, "tls", "file2"))
	assert.NotContains(t, createdFiles, path.Join(tmpdir, "extra_file"))
	assert.NotContains(t, createdFiles, path.Join(tmpdir, "extra_folder", "file1"))
}

func Test_backupHandlerWithPassword_shouldCreateEncryptedATarballArchive(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"password":"secret"}`))
	w := httptest.NewRecorder()

	gate := offlinegate.NewOfflineGate()
	adminMonitor := adminmonitor.New(time.Hour, nil, nil)

	handlerErr := NewHandler(nil, i.NewDatastore(), gate, "./test_assets/handler_test", func() {}, adminMonitor, &demo.Service{}).backup(w, r)
	assert.Nil(t, handlerErr, "Handler should not fail")

	response := w.Result()
	body, _ := io.ReadAll(response.Body)

	tmpdir, _ := ioutils.TempDir("", "backup")
	defer os.RemoveAll(tmpdir)

	dr, err := crypto.AesDecrypt(bytes.NewReader(body), []byte("secret"))
	if err != nil {
		t.Fatal("Failed to decrypt archive")
	}

	archivePath := filepath.Join(tmpdir, "archive.tag.gz")
	archive, _ := os.Create(archivePath)
	defer archive.Close()
	io.Copy(archive, dr)

	cmd := exec.Command("tar", "-xzf", archivePath, "-C", tmpdir)
	err = cmd.Run()
	if err != nil {
		t.Fatal("Failed to extract archive: ", err)
	}

	createdFiles := listFiles(tmpdir)

	contains(t, createdFiles, path.Join(tmpdir, "portainer.key"))
	contains(t, createdFiles, path.Join(tmpdir, "portainer.pub"))
	contains(t, createdFiles, path.Join(tmpdir, "tls", "file1"))
	contains(t, createdFiles, path.Join(tmpdir, "tls", "file2"))
	assert.NotContains(t, createdFiles, path.Join(tmpdir, "extra_file"))
	assert.NotContains(t, createdFiles, path.Join(tmpdir, "extra_folder", "file1"))
}
