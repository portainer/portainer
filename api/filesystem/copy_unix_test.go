//go:build unix

package filesystem

import (
	"os"
	"syscall"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_CopyDir_shouldSkipNonRegularFiles(t *testing.T) {
	t.Parallel()
	source := t.TempDir()
	destination := t.TempDir()

	err := os.WriteFile(JoinPaths(source, "regular"), []byte("content"), 0600)
	require.NoError(t, err)

	err = syscall.Mkfifo(JoinPaths(source, "fifo"), 0600)
	require.NoError(t, err)

	err = CopyDir(source, destination, false)
	require.NoError(t, err)

	assert.FileExists(t, JoinPaths(destination, "regular"))
	assert.NoFileExists(t, JoinPaths(destination, "fifo"))
}
