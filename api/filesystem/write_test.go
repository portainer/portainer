package filesystem

import (
	"io/ioutil"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_WriteFile_CanStoreContentInANewFile(t *testing.T) {
	tmpDir := t.TempDir()
	tmpFilePath := path.Join(tmpDir, "dummy")

	content := []byte("content")
	err := WriteToFile(tmpFilePath, content)
	assert.NoError(t, err)

	fileContent, _ := ioutil.ReadFile(tmpFilePath)
	assert.Equal(t, content, fileContent)
}

func Test_WriteFile_CanOverwriteExistingFile(t *testing.T) {
	tmpDir := t.TempDir()
	tmpFilePath := path.Join(tmpDir, "dummy")

	err := WriteToFile(tmpFilePath, []byte("content"))
	assert.NoError(t, err)

	content := []byte("new content")
	err = WriteToFile(tmpFilePath, content)
	assert.NoError(t, err)

	fileContent, _ := ioutil.ReadFile(tmpFilePath)
	assert.Equal(t, content, fileContent)
}

func Test_WriteFile_CanWriteANestedPath(t *testing.T) {
	tmpDir := t.TempDir()
	tmpFilePath := path.Join(tmpDir, "dir", "sub-dir", "dummy")

	content := []byte("content")
	err := WriteToFile(tmpFilePath, content)
	assert.NoError(t, err)

	fileContent, _ := ioutil.ReadFile(tmpFilePath)
	assert.Equal(t, content, fileContent)
}
