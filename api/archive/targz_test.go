package archive

import (
	"fmt"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"testing"

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

func Test_shouldCreateArhive(t *testing.T) {
	tmpdir := t.TempDir()
	content := []byte("content")
	os.WriteFile(path.Join(tmpdir, "outer"), content, 0600)
	os.MkdirAll(path.Join(tmpdir, "dir"), 0700)
	os.WriteFile(path.Join(tmpdir, "dir", ".dotfile"), content, 0600)
	os.WriteFile(path.Join(tmpdir, "dir", "inner"), content, 0600)

	gzPath, err := TarGzDir(tmpdir)
	assert.Nil(t, err)
	assert.Equal(t, filepath.Join(tmpdir, fmt.Sprintf("%s.tar.gz", filepath.Base(tmpdir))), gzPath)

	extractionDir := t.TempDir()
	cmd := exec.Command("tar", "-xzf", gzPath, "-C", extractionDir)
	err = cmd.Run()
	if err != nil {
		t.Fatal("Failed to extract archive: ", err)
	}
	extractedFiles := listFiles(extractionDir)

	wasExtracted := func(p string) {
		fullpath := path.Join(extractionDir, p)
		assert.Contains(t, extractedFiles, fullpath)
		copyContent, _ := os.ReadFile(fullpath)
		assert.Equal(t, content, copyContent)
	}

	wasExtracted("outer")
	wasExtracted("dir/inner")
	wasExtracted("dir/.dotfile")
}

func Test_shouldCreateArhiveXXXXX(t *testing.T) {
	tmpdir := t.TempDir()
	content := []byte("content")
	os.WriteFile(path.Join(tmpdir, "outer"), content, 0600)
	os.MkdirAll(path.Join(tmpdir, "dir"), 0700)
	os.WriteFile(path.Join(tmpdir, "dir", ".dotfile"), content, 0600)
	os.WriteFile(path.Join(tmpdir, "dir", "inner"), content, 0600)

	gzPath, err := TarGzDir(tmpdir)
	assert.Nil(t, err)
	assert.Equal(t, filepath.Join(tmpdir, fmt.Sprintf("%s.tar.gz", filepath.Base(tmpdir))), gzPath)

	extractionDir := t.TempDir()
	r, _ := os.Open(gzPath)
	ExtractTarGz(r, extractionDir)
	if err != nil {
		t.Fatal("Failed to extract archive: ", err)
	}
	extractedFiles := listFiles(extractionDir)

	wasExtracted := func(p string) {
		fullpath := path.Join(extractionDir, p)
		assert.Contains(t, extractedFiles, fullpath)
		copyContent, _ := os.ReadFile(fullpath)
		assert.Equal(t, content, copyContent)
	}

	wasExtracted("outer")
	wasExtracted("dir/inner")
	wasExtracted("dir/.dotfile")
}
