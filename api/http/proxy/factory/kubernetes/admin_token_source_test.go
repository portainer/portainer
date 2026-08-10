package kubernetes

import (
	"os"
	"sync"
	"testing"
	"time"

	"github.com/portainer/portainer/api/filesystem"
	"github.com/stretchr/testify/require"
)

// writeTokenFile mirrors the kubelet, which swaps a projected token in atomically so
// that readers never observe a partially written file.
func writeTokenFile(t *testing.T, dir, token string) string {
	t.Helper()

	path := filesystem.JoinPaths(dir, "token")
	staged := filesystem.JoinPaths(dir, "token.staged")

	require.NoError(t, os.WriteFile(staged, []byte(token), 0o600))
	require.NoError(t, os.Rename(staged, path))

	return path
}

func TestNewAdminTokenSource(t *testing.T) {
	t.Run("reads the token from disk", func(t *testing.T) {
		path := writeTokenFile(t, t.TempDir(), "initial-token")

		source, err := newAdminTokenSource(path, 0)
		require.NoError(t, err)
		require.Equal(t, "initial-token", source.Token())
	})

	t.Run("trims surrounding whitespace", func(t *testing.T) {
		path := writeTokenFile(t, t.TempDir(), "  initial-token\n")

		source, err := newAdminTokenSource(path, 0)
		require.NoError(t, err)
		require.Equal(t, "initial-token", source.Token())
	})

	t.Run("fails when the token file is missing", func(t *testing.T) {
		_, err := newAdminTokenSource(filesystem.JoinPaths(t.TempDir(), "missing"), 0)
		require.Error(t, err)
	})

	t.Run("fails when the token file is empty", func(t *testing.T) {
		path := writeTokenFile(t, t.TempDir(), "")

		_, err := newAdminTokenSource(path, 0)
		require.Error(t, err)
	})
}

func TestAdminTokenSourceToken(t *testing.T) {
	t.Run("picks up a rotated token once the refresh interval elapsed", func(t *testing.T) {
		dir := t.TempDir()
		path := writeTokenFile(t, dir, "initial-token")

		source, err := newAdminTokenSource(path, 0)
		require.NoError(t, err)
		require.Equal(t, "initial-token", source.Token())

		writeTokenFile(t, dir, "rotated-token")
		require.Equal(t, "rotated-token", source.Token())
	})

	t.Run("serves the cached token within the refresh interval", func(t *testing.T) {
		dir := t.TempDir()
		path := writeTokenFile(t, dir, "initial-token")

		source, err := newAdminTokenSource(path, time.Hour)
		require.NoError(t, err)

		writeTokenFile(t, dir, "rotated-token")
		require.Equal(t, "initial-token", source.Token())
	})

	t.Run("falls back to the last known token when the file becomes unreadable", func(t *testing.T) {
		path := writeTokenFile(t, t.TempDir(), "initial-token")

		source, err := newAdminTokenSource(path, 0)
		require.NoError(t, err)

		require.NoError(t, os.Remove(path))
		require.Equal(t, "initial-token", source.Token())
	})

	t.Run("falls back to the last known token when the file is truncated", func(t *testing.T) {
		dir := t.TempDir()
		path := writeTokenFile(t, dir, "initial-token")

		source, err := newAdminTokenSource(path, 0)
		require.NoError(t, err)

		require.NoError(t, os.WriteFile(path, nil, 0o600))
		require.Equal(t, "initial-token", source.Token())
	})

	t.Run("is safe for concurrent use while the token rotates", func(t *testing.T) {
		const readers, iterations = 8, 50

		dir := t.TempDir()
		path := writeTokenFile(t, dir, "initial-token")
		staged := filesystem.JoinPaths(dir, "token.staged")

		source, err := newAdminTokenSource(path, 0)
		require.NoError(t, err)

		observed := make(chan string, readers*iterations)
		rotationErrs := make(chan error, iterations)

		var wg sync.WaitGroup

		for range readers {
			wg.Go(func() {
				for range iterations {
					observed <- source.Token()
				}
			})
		}

		wg.Go(func() {
			for range iterations {
				if err := os.WriteFile(staged, []byte("rotated-token"), 0o600); err != nil {
					rotationErrs <- err

					return
				}

				if err := os.Rename(staged, path); err != nil {
					rotationErrs <- err

					return
				}
			}
		})

		wg.Wait()
		close(observed)
		close(rotationErrs)

		for err := range rotationErrs {
			require.NoError(t, err)
		}

		for token := range observed {
			require.NotEmpty(t, token)
		}
	})
}

func TestTokenManagerGetAdminServiceAccountToken(t *testing.T) {
	t.Run("returns an empty token when no local admin token is configured", func(t *testing.T) {
		manager := &tokenManager{}
		require.Empty(t, manager.GetAdminServiceAccountToken())
	})

	t.Run("returns the rotated token rather than the one read at construction", func(t *testing.T) {
		dir := t.TempDir()
		path := writeTokenFile(t, dir, "initial-token")

		source, err := newAdminTokenSource(path, 0)
		require.NoError(t, err)

		manager := &tokenManager{adminToken: source}
		require.Equal(t, "initial-token", manager.GetAdminServiceAccountToken())

		writeTokenFile(t, dir, "rotated-token")
		require.Equal(t, "rotated-token", manager.GetAdminServiceAccountToken())
	})
}
