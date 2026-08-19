package archive

import (
	"archive/tar"
	"compress/gzip"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/portainer/portainer/api/filesystem"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func listFiles(dir string) []string {
	items := make([]string, 0)

	if err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if path == dir {
			return nil
		}

		items = append(items, path)

		return nil
	}); err != nil {
		log.Warn().Err(err).Msg("failed to list files in directory")
	}

	return items
}

func Test_shouldCreateArchive(t *testing.T) {
	t.Parallel()
	tmpdir := t.TempDir()
	content := []byte("content")

	err := os.WriteFile(filesystem.JoinPaths(tmpdir, "outer"), content, 0600)
	require.NoError(t, err)

	err = os.MkdirAll(filesystem.JoinPaths(tmpdir, "dir"), 0700)
	require.NoError(t, err)

	err = os.WriteFile(filesystem.JoinPaths(tmpdir, "dir", ".dotfile"), content, 0600)
	require.NoError(t, err)

	err = os.WriteFile(filesystem.JoinPaths(tmpdir, "dir", "inner"), content, 0600)
	require.NoError(t, err)

	gzPath, err := TarGzDir(tmpdir)
	require.NoError(t, err)
	assert.Equal(t, filesystem.JoinPaths(tmpdir, filepath.Base(tmpdir)+".tar.gz"), gzPath)

	extractionDir := t.TempDir()
	cmd := exec.Command("tar", "-xzf", gzPath, "-C", extractionDir)
	if err := cmd.Run(); err != nil {
		t.Fatal("Failed to extract archive: ", err)
	}
	extractedFiles := listFiles(extractionDir)

	wasExtracted := func(p string) {
		fullpath := filesystem.JoinPaths(extractionDir, p)
		assert.Contains(t, extractedFiles, fullpath)
		copyContent, err := os.ReadFile(fullpath)
		require.NoError(t, err)
		assert.Equal(t, content, copyContent)
	}

	wasExtracted("outer")
	wasExtracted("dir/inner")
	wasExtracted("dir/.dotfile")
}

func Test_shouldCreateArchive2(t *testing.T) {
	t.Parallel()
	tmpdir := t.TempDir()
	content := []byte("content")

	err := os.WriteFile(filesystem.JoinPaths(tmpdir, "outer"), content, 0600)
	require.NoError(t, err)

	err = os.MkdirAll(filesystem.JoinPaths(tmpdir, "dir"), 0700)
	require.NoError(t, err)

	err = os.WriteFile(filesystem.JoinPaths(tmpdir, "dir", ".dotfile"), content, 0600)
	require.NoError(t, err)

	err = os.WriteFile(filesystem.JoinPaths(tmpdir, "dir", "inner"), content, 0600)
	require.NoError(t, err)

	gzPath, err := TarGzDir(tmpdir)
	require.NoError(t, err)
	assert.Equal(t, filesystem.JoinPaths(tmpdir, filepath.Base(tmpdir)+".tar.gz"), gzPath)

	extractionDir := t.TempDir()
	r, _ := os.Open(gzPath)
	if err := ExtractTarGz(r, extractionDir); err != nil {
		t.Fatal("Failed to extract archive: ", err)
	}
	extractedFiles := listFiles(extractionDir)

	wasExtracted := func(p string) {
		fullpath := filesystem.JoinPaths(extractionDir, p)
		assert.Contains(t, extractedFiles, fullpath)
		copyContent, _ := os.ReadFile(fullpath)
		assert.Equal(t, content, copyContent)
	}

	wasExtracted("outer")
	wasExtracted("dir/inner")
	wasExtracted("dir/.dotfile")
}

func TestExtractTarGzPathTraversal(t *testing.T) {
	t.Parallel()
	testDir := t.TempDir()

	// Create an evil file with a path traversal attempt
	tarPath := filesystem.JoinPaths(testDir, "evil.tar.gz")

	evilFile, err := os.Create(tarPath)
	require.NoError(t, err)

	gzWriter := gzip.NewWriter(evilFile)
	tarWriter := tar.NewWriter(gzWriter)

	content := []byte("evil content")

	header := &tar.Header{
		Name:     "../evil.txt",
		Mode:     0600,
		Size:     int64(len(content)),
		Typeflag: tar.TypeReg,
	}

	err = tarWriter.WriteHeader(header)
	require.NoError(t, err)

	_, err = tarWriter.Write(content)
	require.NoError(t, err)

	err = tarWriter.Close()
	require.NoError(t, err)

	err = gzWriter.Close()
	require.NoError(t, err)

	err = evilFile.Close()
	require.NoError(t, err)

	// Attempt to extract the evil file
	extractionDir := filesystem.JoinPaths(testDir, "extraction")
	err = os.Mkdir(extractionDir, 0700)
	require.NoError(t, err)

	tarFile, err := os.Open(tarPath)
	require.NoError(t, err)

	// Check that the file didn't escape
	err = ExtractTarGz(tarFile, extractionDir)
	require.NoError(t, err)
	require.NoFileExists(t, filesystem.JoinPaths(testDir, "evil.txt"))

	err = tarFile.Close()
	require.NoError(t, err)
}
