package filesystem

import (
	"fmt"
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
)

// temporary function until upgrade to 1.16
func tempDir(t *testing.T) string {
	tmpDir, err := os.MkdirTemp("", "dir")
	assert.NoError(t, err, "MkdirTemp should not fail")

	return tmpDir
}

func Test_movePath_shouldFailIfOriginalPathDoesntExist(t *testing.T) {
	tmpDir := tempDir(t)
	missingPath := path.Join(tmpDir, "missing")
	targetPath := path.Join(tmpDir, "target")

	defer os.RemoveAll(tmpDir)

	err := MoveDirectory(missingPath, targetPath)
	assert.Error(t, err, "move directory should fail when target path exists")
}

func Test_movePath_shouldFailIfTargetPathDoesExist(t *testing.T) {
	originalPath := tempDir(t)
	missingPath := tempDir(t)

	defer os.RemoveAll(originalPath)
	defer os.RemoveAll(missingPath)

	err := MoveDirectory(originalPath, missingPath)
	assert.Error(t, err, "move directory should fail when target path exists")
}

func Test_movePath_success(t *testing.T) {
	originalPath := tempDir(t)

	defer os.RemoveAll(originalPath)

	err := MoveDirectory(originalPath, fmt.Sprintf("%s-old", originalPath))
	assert.NoError(t, err)
}
