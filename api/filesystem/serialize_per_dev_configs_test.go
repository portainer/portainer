package filesystem

import (
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMultiFilterDirForPerDevConfigs(t *testing.T) {
	t.Parallel()
	f := func(dirEntries []DirEntry, configPath string, multiFilterArgs MultiFilterArgs, wantDirEntries []DirEntry) {
		t.Helper()

		dirEntries, _ = MultiFilterDirForPerDevConfigs(dirEntries, configPath, multiFilterArgs)
		require.Equal(t, wantDirEntries, dirEntries)
	}

	baseDirEntries := []DirEntry{
		{".env", "", true, 420},
		{"docker-compose.yaml", "", true, 420},
		{"configs", "", false, 420},
		{"configs/file1.conf", "", true, 420},
		{"configs/file2.conf", "", true, 420},
		{"configs/folder1", "", false, 420},
		{"configs/folder1/config1", "", true, 420},
		{"configs/folder2", "", false, 420},
		{"configs/folder2/config2", "", true, 420},
	}

	// Filter file1
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{{"file1", portainer.PerDevConfigsTypeFile}},
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[3]},
	)

	// Filter folder1
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{{"folder1", portainer.PerDevConfigsTypeDir}},
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[5], baseDirEntries[6]},
	)

	// Filter file1 and folder1
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{
			{"file1", portainer.PerDevConfigsTypeFile},
			{"folder1", portainer.PerDevConfigsTypeDir},
		},
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[3], baseDirEntries[5], baseDirEntries[6]},
	)

	// Filter file1 and file2
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{
			{"file1", portainer.PerDevConfigsTypeFile},
			{"file2", portainer.PerDevConfigsTypeFile},
		},
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[3], baseDirEntries[4]},
	)

	// Filter folder1 and folder2
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{
			{"folder1", portainer.PerDevConfigsTypeDir},
			{"folder2", portainer.PerDevConfigsTypeDir},
		},
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[5], baseDirEntries[6], baseDirEntries[7], baseDirEntries[8]},
	)
}

func TestMultiFilterDirForPerDevConfigsWithDefaults(t *testing.T) {
	t.Parallel()
	f := func(dirEntries []DirEntry, configPath string, multiFilterArgs MultiFilterArgs, defaultFilenames []string, wantDirEntries []DirEntry) {
		t.Helper()

		dirEntries, _ = MultiFilterDirForPerDevConfigsWithDefaults(dirEntries, configPath, multiFilterArgs, defaultFilenames)
		require.Equal(t, wantDirEntries, dirEntries)
	}

	baseDirEntries := []DirEntry{
		{".env", "", true, 420},
		{"docker-compose.yaml", "", true, 420},
		{"configs", "", false, 420},
		{"configs/file1.conf", "", true, 420},
		{"configs/file2.conf", "", true, 420},
		{"configs/folder1", "", false, 420},
		{"configs/folder1/config1", "", true, 420},
		{"configs/folder2", "", false, 420},
		{"configs/folder2/config2", "", true, 420},
		{"configs/docker-compose-2.yaml", "", true, 420},
		{"configs/folder2/docker-compose-3.yaml", "", true, 420},
	}

	// Filter file1
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{{"file1", portainer.PerDevConfigsTypeFile}},
		nil,
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[3]},
	)

	// Filter folder1
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{{"folder1", portainer.PerDevConfigsTypeDir}},
		nil,
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[5], baseDirEntries[6]},
	)

	// Filter file1 and folder1
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{
			{"file1", portainer.PerDevConfigsTypeFile},
			{"folder1", portainer.PerDevConfigsTypeDir},
		},
		nil,
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[3], baseDirEntries[5], baseDirEntries[6]},
	)

	// Filter file1 and file2
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{
			{"file1", portainer.PerDevConfigsTypeFile},
			{"file2", portainer.PerDevConfigsTypeFile},
		},
		nil,
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[3], baseDirEntries[4]},
	)

	// Filter folder1 and folder2
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{
			{"folder1", portainer.PerDevConfigsTypeDir},
			{"folder2", portainer.PerDevConfigsTypeDir},
		},
		nil,
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[5], baseDirEntries[6], baseDirEntries[7], baseDirEntries[8], baseDirEntries[10]},
	)

	// Filter file1 and folder1 and docker-compose-2.yaml
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{
			{"file1", portainer.PerDevConfigsTypeFile},
			{"folder1", portainer.PerDevConfigsTypeDir},
		},
		[]string{"configs/docker-compose-2.yaml"},
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[3], baseDirEntries[5], baseDirEntries[6], baseDirEntries[9]},
	)

	// Filter file1 and docker-compose-3.yaml
	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{
			{"file1", portainer.PerDevConfigsTypeFile},
		},
		[]string{"configs/folder2/docker-compose-3.yaml"},
		[]DirEntry{baseDirEntries[0], baseDirEntries[1], baseDirEntries[2], baseDirEntries[3], baseDirEntries[10]},
	)
}

func TestMultiFilterDirForPerDevConfigsEnvFiles(t *testing.T) {
	t.Parallel()
	f := func(dirEntries []DirEntry, configPath string, multiFilterArgs MultiFilterArgs, wantEnvFiles []string) {
		t.Helper()

		_, envFiles := MultiFilterDirForPerDevConfigs(dirEntries, configPath, multiFilterArgs)
		require.Equal(t, wantEnvFiles, envFiles)
	}

	baseDirEntries := []DirEntry{
		{".env", "", true, 420},
		{"docker-compose.yaml", "", true, 420},
		{"configs", "", false, 420},
		{"configs/edge-id/edge-id.env", "", true, 420},
	}

	f(
		baseDirEntries,
		"configs",
		MultiFilterArgs{{"edge-id", portainer.PerDevConfigsTypeDir}},
		[]string{"configs/edge-id/edge-id.env"},
	)

}

func TestIsInConfigDir(t *testing.T) {
	t.Parallel()
	f := func(dirEntry DirEntry, configPath string, expect bool) {
		t.Helper()

		actual := isInConfigDir(dirEntry, configPath)
		assert.Equal(t, expect, actual)
	}

	f(DirEntry{Name: "edge-configs"}, "edge-configs", false)
	f(DirEntry{Name: "edge-configs_backup"}, "edge-configs", false)
	f(DirEntry{Name: "edge-configs/standalone-edge-agent-standard"}, "edge-configs", true)
	f(DirEntry{Name: "parent/edge-configs/"}, "edge-configs", false)
	f(DirEntry{Name: "edgestacktest"}, "edgestacktest/edge-configs", false)
	f(DirEntry{Name: "edgestacktest/edgeconfigs-test.yaml"}, "edgestacktest/edge-configs", false)
	f(DirEntry{Name: "edgestacktest/file1.conf"}, "edgestacktest/edge-configs", false)
	f(DirEntry{Name: "edgeconfigs-test.yaml"}, "edgestacktest/edge-configs", false)
	f(DirEntry{Name: "edgestacktest/edge-configs"}, "edgestacktest/edge-configs", false)
	f(DirEntry{Name: "edgestacktest/edge-configs/standalone-edge-agent-async"}, "edgestacktest/edge-configs", true)
	f(DirEntry{Name: "edgestacktest/edge-configs/abc.txt"}, "edgestacktest/edge-configs", true)
}

func TestShouldIncludeDir(t *testing.T) {
	t.Parallel()
	f := func(dirEntry DirEntry, deviceName, configPath string, expect bool) {
		t.Helper()

		actual := shouldIncludeDir(dirEntry, deviceName, configPath)
		assert.Equal(t, expect, actual)
	}

	f(DirEntry{Name: "app/blue-app", IsFile: false}, "blue-app", "app", true)
	f(DirEntry{Name: "app/blue-app/values.yaml", IsFile: true}, "blue-app", "app", true)
}
