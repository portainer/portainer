package compose

import (
	"os"
	"testing"

	"github.com/portainer/portainer/api/filesystem"

	"github.com/compose-spec/compose-go/v2/types"
	"github.com/stretchr/testify/require"
)

func TestPathHash_File(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	path := filesystem.JoinPaths(dir, "file.txt")

	require.NoError(t, os.WriteFile(path, []byte("hello"), 0644))

	h1, err := pathHash(path)
	require.NoError(t, err)
	require.NotEmpty(t, h1)

	// Same content, same hash
	h2, err := pathHash(path)
	require.NoError(t, err)
	require.Equal(t, h1, h2)

	// Different content, different hash
	require.NoError(t, os.WriteFile(path, []byte("world"), 0644))
	h3, err := pathHash(path)
	require.NoError(t, err)
	require.NotEqual(t, h1, h3)
}

func TestPathHash_Directory(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	require.NoError(t, os.WriteFile(filesystem.JoinPaths(dir, "a.txt"), []byte("aaa"), 0644))
	require.NoError(t, os.WriteFile(filesystem.JoinPaths(dir, "b.txt"), []byte("bbb"), 0644))

	h1, err := pathHash(dir)
	require.NoError(t, err)

	// Same directory -> same hash
	h2, err := pathHash(dir)
	require.NoError(t, err)
	require.Equal(t, h1, h2)

	// Rename a file -> different hash (relative path is part of the hash)
	require.NoError(t, os.Rename(filesystem.JoinPaths(dir, "a.txt"), filesystem.JoinPaths(dir, "c.txt")))
	h3, err := pathHash(dir)
	require.NoError(t, err)
	require.NotEqual(t, h1, h3, "renaming a file should change the directory hash")

	// Restore and change content -> different hash
	require.NoError(t, os.Rename(filesystem.JoinPaths(dir, "c.txt"), filesystem.JoinPaths(dir, "a.txt")))
	require.NoError(t, os.WriteFile(filesystem.JoinPaths(dir, "a.txt"), []byte("modified"), 0644))
	h4, err := pathHash(dir)
	require.NoError(t, err)
	require.NotEqual(t, h1, h4, "changing file content should change the directory hash")
}

func TestAddBindMountHashLabel(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	webDir := filesystem.JoinPaths(dir, "web")
	require.NoError(t, os.MkdirAll(webDir, 0755))
	require.NoError(t, os.WriteFile(filesystem.JoinPaths(webDir, "nginx.conf"), []byte("server {}"), 0644))

	t.Run("no bind mounts", func(t *testing.T) {
		svc := types.ServiceConfig{Name: "web"}
		result, err := addBindMountHashLabel("web", svc)
		require.NoError(t, err)
		require.Empty(t, result.Labels[BindMountHashLabelKey])
	})

	t.Run("non-bind volume is skipped", func(t *testing.T) {
		svc := types.ServiceConfig{
			Name:    "web",
			Volumes: []types.ServiceVolumeConfig{{Type: "volume", Source: "myvolume"}},
		}
		result, err := addBindMountHashLabel("web", svc)
		require.NoError(t, err)
		require.Empty(t, result.Labels[BindMountHashLabelKey])
	})

	t.Run("missing path silently skips label", func(t *testing.T) {
		svc := types.ServiceConfig{
			Name:    "web",
			Volumes: []types.ServiceVolumeConfig{{Type: "bind", Source: "/nonexistent/path"}},
		}
		result, err := addBindMountHashLabel("web", svc)
		require.NoError(t, err)
		require.Empty(t, result.Labels[BindMountHashLabelKey])
	})

	t.Run("valid bind mount with directory source sets label", func(t *testing.T) {
		svc := types.ServiceConfig{
			Name:    "web",
			Volumes: []types.ServiceVolumeConfig{{Type: "bind", Source: webDir}},
		}
		result, err := addBindMountHashLabel("web", svc)
		require.NoError(t, err)
		require.NotEmpty(t, result.Labels[BindMountHashLabelKey])
	})

	t.Run("valid bind mount with file source sets label", func(t *testing.T) {
		svc := types.ServiceConfig{
			Name:    "web",
			Volumes: []types.ServiceVolumeConfig{{Type: "bind", Source: filesystem.JoinPaths(webDir, "nginx.conf")}},
		}
		result, err := addBindMountHashLabel("web", svc)
		require.NoError(t, err)
		require.NotEmpty(t, result.Labels[BindMountHashLabelKey])
	})

	t.Run("label is deterministic", func(t *testing.T) {
		svc := types.ServiceConfig{
			Name:    "web",
			Volumes: []types.ServiceVolumeConfig{{Type: "bind", Source: webDir}},
		}
		r1, err := addBindMountHashLabel("web", svc)
		require.NoError(t, err)
		r2, err := addBindMountHashLabel("web", svc)
		require.NoError(t, err)
		require.Equal(t, r1.Labels[BindMountHashLabelKey], r2.Labels[BindMountHashLabelKey])
	})
}
