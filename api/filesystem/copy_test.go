package filesystem

import (
	"os"
	"path"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_copyFile_returnsError_whenSourceDoesNotExist(t *testing.T) {
	tmpdir := t.TempDir()
	err := copyFile("does-not-exist", tmpdir)
	require.Error(t, err)
}

func Test_copyFile_shouldMakeAbackup(t *testing.T) {
	tmpdir := t.TempDir()
	content := []byte("content")

	err := os.WriteFile(path.Join(tmpdir, "origin"), content, 0600)
	require.NoError(t, err)

	err = copyFile(path.Join(tmpdir, "origin"), path.Join(tmpdir, "copy"))
	require.NoError(t, err)

	copyContent, err := os.ReadFile(path.Join(tmpdir, "copy"))
	require.NoError(t, err)
	assert.Equal(t, content, copyContent)
}

func Test_CopyDir_shouldCopyAllFilesAndDirectories(t *testing.T) {
	destination := t.TempDir()
	err := CopyDir("./testdata/copy_test", destination, true)
	require.NoError(t, err)

	assert.FileExists(t, filepath.Join(destination, "copy_test", "outer"))
	assert.FileExists(t, filepath.Join(destination, "copy_test", "dir", ".dotfile"))
	assert.FileExists(t, filepath.Join(destination, "copy_test", "dir", "inner"))
}

func Test_CopyDir_shouldCopyOnlyDirContents(t *testing.T) {
	destination := t.TempDir()
	err := CopyDir("./testdata/copy_test", destination, false)
	require.NoError(t, err)

	assert.FileExists(t, filepath.Join(destination, "outer"))
	assert.FileExists(t, filepath.Join(destination, "dir", ".dotfile"))
	assert.FileExists(t, filepath.Join(destination, "dir", "inner"))
}

func Test_CopyPath_shouldSkipWhenNotExist(t *testing.T) {
	tmpdir := t.TempDir()
	err := CopyPath("does-not-exists", tmpdir)
	require.NoError(t, err)

	assert.NoFileExists(t, tmpdir)
}

func Test_CopyPath_shouldCopyFile(t *testing.T) {
	tmpdir := t.TempDir()
	content := []byte("content")

	err := os.WriteFile(path.Join(tmpdir, "file"), content, 0600)
	require.NoError(t, err)

	err = os.MkdirAll(path.Join(tmpdir, "backup"), 0700)
	require.NoError(t, err)

	err = CopyPath(path.Join(tmpdir, "file"), path.Join(tmpdir, "backup"))
	require.NoError(t, err)

	copyContent, err := os.ReadFile(path.Join(tmpdir, "backup", "file"))
	require.NoError(t, err)
	assert.Equal(t, content, copyContent)
}

func Test_CopyPath_shouldCopyDir(t *testing.T) {
	destination := t.TempDir()
	err := CopyPath("./testdata/copy_test", destination)
	require.NoError(t, err)

	assert.FileExists(t, filepath.Join(destination, "copy_test", "outer"))
	assert.FileExists(t, filepath.Join(destination, "copy_test", "dir", ".dotfile"))
	assert.FileExists(t, filepath.Join(destination, "copy_test", "dir", "inner"))
}

func TestCopyPathPanic(t *testing.T) {
	dir := t.TempDir()
	p := filepath.Join(dir, "myfile")

	err := os.WriteFile(p, []byte("contents"), 0644)
	require.NoError(t, err)

	err = os.Chmod(dir, 0)
	require.NoError(t, err)

	err = CopyPath(p, t.TempDir())
	require.Error(t, err)

	err = os.Chmod(dir, 0755)
	require.NoError(t, err)
}
