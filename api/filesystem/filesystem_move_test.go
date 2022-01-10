package filesystem

import (
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_movePath_shouldFailIfSourceDirDoesNotExist(t *testing.T) {
	sourceDir := "missing"
	destinationDir := t.TempDir()
	file1 := addFile(destinationDir, "dir", "file")
	file2 := addFile(destinationDir, "file")

	err := MoveDirectory(sourceDir, destinationDir)
	assert.Error(t, err, "move directory should fail when source path is missing")
	assert.FileExists(t, file1, "destination dir contents should remain")
	assert.FileExists(t, file2, "destination dir contents should remain")
}

func Test_movePath_shouldFailIfDestinationDirExists(t *testing.T) {
	sourceDir := t.TempDir()
	file1 := addFile(sourceDir, "dir", "file")
	file2 := addFile(sourceDir, "file")
	destinationDir := t.TempDir()
	file3 := addFile(destinationDir, "dir", "file")
	file4 := addFile(destinationDir, "file")

	err := MoveDirectory(sourceDir, destinationDir)
	assert.Error(t, err, "move directory should fail when destination directory already exists")
	assert.FileExists(t, file1, "source dir contents should remain")
	assert.FileExists(t, file2, "source dir contents should remain")
	assert.FileExists(t, file3, "destination dir contents should remain")
	assert.FileExists(t, file4, "destination dir contents should remain")
}

func Test_movePath_successWhenSourceExistsAndDestinationIsMissing(t *testing.T) {
	tmp := t.TempDir()
	sourceDir := path.Join(tmp, "source")
	os.Mkdir(sourceDir, 0766)
	file1 := addFile(sourceDir, "dir", "file")
	file2 := addFile(sourceDir, "file")
	destinationDir := path.Join(tmp, "destination")

	err := MoveDirectory(sourceDir, destinationDir)
	assert.NoError(t, err)
	assert.NoFileExists(t, file1, "source dir contents should be moved")
	assert.NoFileExists(t, file2, "source dir contents should be moved")
	assertFileContent(t, path.Join(destinationDir, "file"))
	assertFileContent(t, path.Join(destinationDir, "dir", "file"))
}

var content []byte = []byte("content")

func addFile(fileParts ...string) (filepath string) {
	if len(fileParts) > 2 {
		dir := path.Join(fileParts[:len(fileParts)-1]...)
		os.MkdirAll(dir, 0766)
	}

	p := path.Join(fileParts...)
	os.WriteFile(p, content, 0766)
	return p
}

func assertFileContent(t *testing.T, filePath string) {
	actualContent, err := os.ReadFile(filePath)
	assert.NoErrorf(t, err, "failed to read file %s", filePath)
	assert.Equal(t, content, actualContent, "file %s content doesn't match", filePath)
}
