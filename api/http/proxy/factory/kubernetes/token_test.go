package kubernetes

import (
	"os"
	"path/filepath"
	"sync"
	"testing"
)

func useTempTokenFile(t *testing.T, contents string) string {
	t.Helper()
	tokenFile := filepath.Join(t.TempDir(), "token")
	if err := os.WriteFile(tokenFile, []byte(contents), 0o600); err != nil {
		t.Fatalf("failed seeding token file: %v", err)
	}
	original := defaultServiceAccountTokenFile
	defaultServiceAccountTokenFile = tokenFile
	t.Cleanup(func() { defaultServiceAccountTokenFile = original })
	return tokenFile
}

// regression test for issue #13150: a rotated on-disk token must be picked up
func TestAdminTokenRefreshesAfterRotation(t *testing.T) {
	const tokenV1 = "TOKEN_V1_minted_at_pod_start"
	const tokenV2 = "TOKEN_V2_rotated_by_kubelet"

	tokenFile := useTempTokenFile(t, tokenV1)

	manager, err := NewTokenManager(nil, nil, nil, true)
	if err != nil {
		t.Fatalf("NewTokenManager failed: %v", err)
	}

	if got := manager.GetAdminServiceAccountToken(); got != tokenV1 {
		t.Fatalf("expected freshly-read token %q, got %q", tokenV1, got)
	}

	if err := os.WriteFile(tokenFile, []byte(tokenV2), 0o600); err != nil {
		t.Fatalf("failed rotating token file: %v", err)
	}

	if got := manager.GetAdminServiceAccountToken(); got != tokenV2 {
		t.Fatalf("expected rotated token %q, got stale %q", tokenV2, got)
	}
}

// a read failure must fall back to the last-known-good token, not empty
func TestAdminTokenFallsBackWhenFileUnreadable(t *testing.T) {
	const tokenV1 = "TOKEN_V1_last_known_good"

	tokenFile := useTempTokenFile(t, tokenV1)

	manager, err := NewTokenManager(nil, nil, nil, true)
	if err != nil {
		t.Fatalf("NewTokenManager failed: %v", err)
	}
	if got := manager.GetAdminServiceAccountToken(); got != tokenV1 {
		t.Fatalf("expected %q, got %q", tokenV1, got)
	}

	if err := os.Remove(tokenFile); err != nil {
		t.Fatalf("failed removing token file: %v", err)
	}

	if got := manager.GetAdminServiceAccountToken(); got != tokenV1 {
		t.Fatalf("expected fallback to last-known-good %q, got %q", tokenV1, got)
	}
}

// Agent/Edge environments stay empty and never read the file
func TestAdminTokenEmptyForNonLocalEnv(t *testing.T) {
	original := defaultServiceAccountTokenFile
	defaultServiceAccountTokenFile = filepath.Join(t.TempDir(), "does-not-exist")
	t.Cleanup(func() { defaultServiceAccountTokenFile = original })

	manager, err := NewTokenManager(nil, nil, nil, false)
	if err != nil {
		t.Fatalf("NewTokenManager failed: %v", err)
	}

	if got := manager.GetAdminServiceAccountToken(); got != "" {
		t.Fatalf("expected empty token for non-local env, got %q", got)
	}
}

// concurrent readers while the file rotates, run under -race
func TestAdminTokenRefreshConcurrent(t *testing.T) {
	tokenFile := useTempTokenFile(t, "TOKEN_INITIAL")

	manager, err := NewTokenManager(nil, nil, nil, true)
	if err != nil {
		t.Fatalf("NewTokenManager failed: %v", err)
	}

	stop := make(chan struct{})

	var rotator sync.WaitGroup
	rotator.Add(1)
	go func() {
		defer rotator.Done()
		for i := 0; ; i++ {
			select {
			case <-stop:
				return
			default:
				tmp := tokenFile + ".tmp"
				if err := os.WriteFile(tmp, []byte("TOKEN_"+string(rune('A'+i%26))), 0o600); err != nil {
					continue
				}
				_ = os.Rename(tmp, tokenFile)
			}
		}
	}()

	var readers sync.WaitGroup
	for range 8 {
		readers.Add(1)
		go func() {
			defer readers.Done()
			for range 500 {
				if got := manager.GetAdminServiceAccountToken(); got == "" {
					t.Errorf("got empty token during concurrent refresh")
					return
				}
			}
		}()
	}

	readers.Wait()
	close(stop)
	rotator.Wait()
}
