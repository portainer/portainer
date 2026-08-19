package archive

import (
	"testing"

	"github.com/portainer/portainer/api/filesystem"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUnzipFile(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	/*
		Archive structure.
		├── 0
		│	├── 1
		│	│	└── 2.txt
		│	└── 1.txt
		└── 0.txt
	*/

	err := UnzipFile("./testdata/sample_archive.zip", dir)

	require.NoError(t, err)
	archiveDir := dir + "/sample_archive"
	assert.FileExists(t, filesystem.JoinPaths(archiveDir, "0.txt"))
	assert.FileExists(t, filesystem.JoinPaths(archiveDir, "0", "1.txt"))
	assert.FileExists(t, filesystem.JoinPaths(archiveDir, "0", "1", "2.txt"))

}
