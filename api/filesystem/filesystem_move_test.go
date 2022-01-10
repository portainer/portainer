package filesystem

import (
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_movePath_shouldFailIfSourcePathDoesNotExist(t *testing.T) {
	sourcePath := "missing"
	desinationPath := t.TempDir()

	err := MoveDirectory(sourcePath, desinationPath)
	assert.Error(t, err, "move directory should fail when shource path is missing")
}

func Test_movePath_shouldFailIfDestinationPathExists(t *testing.T) {
	sourcePath := t.TempDir()
	desinationPath := t.TempDir()

	err := MoveDirectory(sourcePath, desinationPath)
	assert.Error(t, err, "move directory should fail when destination directory already exists")
}

func Test_movePath_successWhenSourceExistsAndDestinationIsMissing(t *testing.T) {
	tmp := t.TempDir()
	sourcePath := path.Join(tmp, "source")
	os.Mkdir(sourcePath, 0600)
	destinationPath := path.Join(tmp, "destination")

	err := MoveDirectory(sourcePath, destinationPath)
	assert.NoError(t, err)
}
