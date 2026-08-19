package filesystem

import (
	"fmt"
	"math/rand"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_fileSystemService_FileExists_whenFileExistsShouldReturnTrue(t *testing.T) {
	t.Parallel()
	service := createService(t)
	testHelperFileExists_fileExists(t, service.FileExists)
}

func Test_fileSystemService_FileExists_whenFileNotExistsShouldReturnFalse(t *testing.T) {
	t.Parallel()
	service := createService(t)
	testHelperFileExists_fileNotExists(t, service.FileExists)
}

func Test_FileExists_whenFileExistsShouldReturnTrue(t *testing.T) {
	t.Parallel()
	testHelperFileExists_fileExists(t, FileExists)
}

func Test_FileExists_whenFileNotExistsShouldReturnFalse(t *testing.T) {
	t.Parallel()
	testHelperFileExists_fileNotExists(t, FileExists)
}

func testHelperFileExists_fileExists(t *testing.T, checker func(path string) (bool, error)) {
	file, err := os.CreateTemp(t.TempDir(), t.Name())
	require.NoError(t, err, "CreateTemp should not fail")

	t.Cleanup(func() {
		err := os.RemoveAll(file.Name())
		require.NoError(t, err)
	})

	exists, err := checker(file.Name())
	require.NoError(t, err, "FileExists should not fail")

	assert.True(t, exists)
}

func testHelperFileExists_fileNotExists(t *testing.T, checker func(path string) (bool, error)) {
	filePath := JoinPaths(t.TempDir(), fmt.Sprintf("%s%d", t.Name(), rand.Int()))

	err := os.RemoveAll(filePath)
	require.NoError(t, err, "RemoveAll should not fail")

	exists, err := checker(filePath)
	require.NoError(t, err, "FileExists should not fail")

	assert.False(t, exists)
}
