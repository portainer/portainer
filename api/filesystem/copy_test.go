package filesystem

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_copyFile_returnsError_whenSourceDoesNotExist(t *testing.T) {
	t.Parallel()
	tmpdir := t.TempDir()
	err := copyFile("does-not-exist", tmpdir)
	require.Error(t, err)
}

func Test_copyFile_shouldMakeAbackup(t *testing.T) {
	t.Parallel()
	tmpdir := t.TempDir()
	content := []byte("content")

	err := os.WriteFile(JoinPaths(tmpdir, "origin"), content, 0600)
	require.NoError(t, err)

	err = copyFile(JoinPaths(tmpdir, "origin"), JoinPaths(tmpdir, "copy"))
	require.NoError(t, err)

	copyContent, err := os.ReadFile(JoinPaths(tmpdir, "copy"))
	require.NoError(t, err)
	assert.Equal(t, content, copyContent)
}

func Test_CopyDir_shouldCopyAllFilesAndDirectories(t *testing.T) {
	t.Parallel()
	destination := t.TempDir()
	err := CopyDir("./testdata/copy_test", destination, true)
	require.NoError(t, err)

	assert.FileExists(t, JoinPaths(destination, "copy_test", "outer"))
	assert.FileExists(t, JoinPaths(destination, "copy_test", "dir", ".dotfile"))
	assert.FileExists(t, JoinPaths(destination, "copy_test", "dir", "inner"))
}

func Test_CopyDir_shouldCopyOnlyDirContents(t *testing.T) {
	t.Parallel()
	destination := t.TempDir()
	err := CopyDir("./testdata/copy_test", destination, false)
	require.NoError(t, err)

	assert.FileExists(t, JoinPaths(destination, "outer"))
	assert.FileExists(t, JoinPaths(destination, "dir", ".dotfile"))
	assert.FileExists(t, JoinPaths(destination, "dir", "inner"))
}

func Test_CopyPath_shouldSkipWhenNotExist(t *testing.T) {
	t.Parallel()
	tmpdir := t.TempDir()
	err := CopyPath("does-not-exists", tmpdir)
	require.NoError(t, err)

	assert.NoFileExists(t, tmpdir)
}

func Test_CopyPath_shouldCopyFile(t *testing.T) {
	t.Parallel()
	tmpdir := t.TempDir()
	content := []byte("content")

	err := os.WriteFile(JoinPaths(tmpdir, "file"), content, 0600)
	require.NoError(t, err)

	err = os.MkdirAll(JoinPaths(tmpdir, "backup"), 0700)
	require.NoError(t, err)

	err = CopyPath(JoinPaths(tmpdir, "file"), JoinPaths(tmpdir, "backup"))
	require.NoError(t, err)

	copyContent, err := os.ReadFile(JoinPaths(tmpdir, "backup", "file"))
	require.NoError(t, err)
	assert.Equal(t, content, copyContent)
}

func Test_CopyPath_shouldCopyDir(t *testing.T) {
	t.Parallel()
	destination := t.TempDir()
	err := CopyPath("./testdata/copy_test", destination)
	require.NoError(t, err)

	assert.FileExists(t, JoinPaths(destination, "copy_test", "outer"))
	assert.FileExists(t, JoinPaths(destination, "copy_test", "dir", ".dotfile"))
	assert.FileExists(t, JoinPaths(destination, "copy_test", "dir", "inner"))
}

func TestCopyPathPanic(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	p := JoinPaths(dir, "myfile")

	err := os.WriteFile(p, []byte("contents"), 0644)
	require.NoError(t, err)

	err = os.Chmod(dir, 0)
	require.NoError(t, err)

	err = CopyPath(p, t.TempDir())
	require.Error(t, err)

	err = os.Chmod(dir, 0755)
	require.NoError(t, err)
}
