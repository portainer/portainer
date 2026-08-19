package filesystem

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var content = []byte("content")

func Test_movePath_shouldFailIfSourceDirDoesNotExist(t *testing.T) {
	t.Parallel()
	sourceDir := "missing"
	destinationDir := t.TempDir()
	file1 := addFile(t, destinationDir, "dir", "file")
	file2 := addFile(t, destinationDir, "file")

	err := MoveDirectory(sourceDir, destinationDir, false)
	require.Error(t, err, "move directory should fail when source path is missing")
	assert.FileExists(t, file1, "destination dir contents should remain")
	assert.FileExists(t, file2, "destination dir contents should remain")
}

func Test_movePath_shouldFailIfDestinationDirExists(t *testing.T) {
	t.Parallel()
	sourceDir := t.TempDir()
	file1 := addFile(t, sourceDir, "dir", "file")
	file2 := addFile(t, sourceDir, "file")
	destinationDir := t.TempDir()
	file3 := addFile(t, destinationDir, "dir", "file")
	file4 := addFile(t, destinationDir, "file")

	err := MoveDirectory(sourceDir, destinationDir, false)
	require.Error(t, err, "move directory should fail when destination directory already exists")
	assert.FileExists(t, file1, "source dir contents should remain")
	assert.FileExists(t, file2, "source dir contents should remain")
	assert.FileExists(t, file3, "destination dir contents should remain")
	assert.FileExists(t, file4, "destination dir contents should remain")
}

func Test_movePath_succesIfOverwriteSetWhenDestinationDirExists(t *testing.T) {
	t.Parallel()
	sourceDir := t.TempDir()
	file1 := addFile(t, sourceDir, "dir", "file")
	file2 := addFile(t, sourceDir, "file")
	destinationDir := t.TempDir()
	file3 := addFile(t, destinationDir, "dir", "file")
	file4 := addFile(t, destinationDir, "file")

	err := MoveDirectory(sourceDir, destinationDir, true)
	require.NoError(t, err)
	assert.NoFileExists(t, file1, "source dir contents should be moved")
	assert.NoFileExists(t, file2, "source dir contents should be moved")
	assert.FileExists(t, file3, "destination dir contents should remain")
	assert.FileExists(t, file4, "destination dir contents should remain")
}

func Test_movePath_successWhenSourceExistsAndDestinationIsMissing(t *testing.T) {
	t.Parallel()
	tmp := t.TempDir()
	sourceDir := JoinPaths(tmp, "source")
	err := os.Mkdir(sourceDir, 0766)
	require.NoError(t, err)

	file1 := addFile(t, sourceDir, "dir", "file")
	file2 := addFile(t, sourceDir, "file")
	destinationDir := JoinPaths(tmp, "destination")

	err = MoveDirectory(sourceDir, destinationDir, false)
	require.NoError(t, err)
	assert.NoFileExists(t, file1, "source dir contents should be moved")
	assert.NoFileExists(t, file2, "source dir contents should be moved")
	assertFileContent(t, JoinPaths(destinationDir, "file"))
	assertFileContent(t, JoinPaths(destinationDir, "dir", "file"))
}

func addFile(t *testing.T, fileParts ...string) (filepath string) {
	if len(fileParts) > 2 {
		dir := JoinPaths(fileParts[0], fileParts[1:len(fileParts)-1]...)
		err := os.MkdirAll(dir, 0766)
		require.NoError(t, err)
	}

	p := JoinPaths(fileParts[0], fileParts[1:]...)
	err := os.WriteFile(p, content, 0766)
	require.NoError(t, err)

	return p
}

func assertFileContent(t *testing.T, filePath string) {
	actualContent, err := os.ReadFile(filePath)
	require.NoError(t, err, "failed to read file %s", filePath)
	assert.Equal(t, content, actualContent, "file %s content doesn't match", filePath)
}
