package filesystem

import (
	"errors"
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
)

func createService(t *testing.T) *Service {
	dataStorePath := path.Join(t.TempDir(), t.Name())

	service, err := NewService(dataStorePath, "")
	assert.NoError(t, err, "NewService should not fail")

	t.Cleanup(func() {
		os.RemoveAll(dataStorePath)
	})

	return service
}

func prepareDir(t *testing.T, dir string) error {
	err := os.MkdirAll(path.Join(dir, "data", "compose", "1"), 0755)
	if err != nil {
		return err
	}

	file, err := os.Create(path.Join(dir, "data", "compose", "1", "docker-compose.yml"))
	if err != nil {
		return err
	}

	file.Close()
	return nil
}

func TestSafeSafeMoveDirectory(t *testing.T) {
	t.Run("able to migrate original folder when the backup folder already exists", func(t *testing.T) {
		testDir := path.Join(t.TempDir(), t.Name())
		err := prepareDir(t, testDir)
		assert.NoError(t, err, "prepareDir should not fail")
		defer os.RemoveAll(testDir)

		err = os.MkdirAll(path.Join(testDir, "data", "compose", "1-backup"), 0755)
		assert.NoError(t, err, "create backupdir should not fail")
		assert.DirExists(t, path.Join(testDir, "data", "compose", "1-backup"), "backupdir should exist")

		src := path.Join(testDir, "data", "compose", "1")
		dst := path.Join(testDir, "data", "compose", "1", "v1")
		err = safeMoveDirectory(src, dst, CopyDir)
		assert.NoError(t, err, "safeMoveDirectory should not fail")

		assert.FileExists(t, path.Join(testDir, "data", "compose", "1", "v1", "docker-compose.yml"), "docker-compose.yml should be migrated")
		assert.NoDirExists(t, path.Join(testDir, "data", "compose", "1-backup"), "backupdir should not exist")

	})

	t.Run("original folder can be restored if error occurs", func(t *testing.T) {
		testDir := path.Join(t.TempDir(), t.Name())
		err := prepareDir(t, testDir)
		assert.NoError(t, err, "prepareDir should not fail")
		defer os.RemoveAll(testDir)

		src := path.Join(testDir, "data", "compose", "1")
		dst := path.Join(testDir, "data", "compose", "1", "v1")

		copyDirFunc := func(string, string, bool) error {
			return errors.New("mock copy dir error")
		}
		err = safeMoveDirectory(src, dst, copyDirFunc)
		assert.Error(t, err, "safeMoveDirectory should fail")

		assert.FileExists(t, path.Join(testDir, "data", "compose", "1", "docker-compose.yml"), "original folder should be restored")
		assert.NoDirExists(t, path.Join(testDir, "data", "compose", "1", "v1"), "the target folder should not exist")
		assert.NoFileExists(t, path.Join(testDir, "data", "compose", "1", "v1", "docker-compose.yml"), "docker-compose.yml should not be migrated")
		assert.NoDirExists(t, path.Join(testDir, "data", "compose", "1-backup"), "backupdir should not exist")
	})

}
