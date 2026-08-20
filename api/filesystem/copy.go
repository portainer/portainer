package filesystem

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/portainer/portainer/api/logs"

	"github.com/rs/zerolog/log"
)

const backupTimeoutEnvVar = "PORTAINER_BACKUP_TIMEOUT"

var BackupTimeout = resolveBackupTimeout(time.Hour)

func resolveBackupTimeout(defaultTimeout time.Duration) time.Duration {
	val := os.Getenv(backupTimeoutEnvVar)
	if val == "" {
		return defaultTimeout
	}

	parsed, err := time.ParseDuration(val)
	if err != nil {
		log.Warn().Err(err).Str(backupTimeoutEnvVar, val).Msg("failed to parse " + backupTimeoutEnvVar + " variable")
		return defaultTimeout
	}

	return parsed
}

// CopyPath copies file or directory defined by the path to the toDir path
func CopyPath(path string, toDir string) error {
	info, err := os.Stat(path)
	if err != nil && errors.Is(err, os.ErrNotExist) {
		// skip copy if file does not exist
		return nil
	} else if err != nil {
		return err
	}

	return RunWithTimeout(path, BackupTimeout, func() error {
		if !info.IsDir() {
			return copyFile(path, JoinPaths(toDir, info.Name()))
		}

		return CopyDir(path, toDir, true)
	})
}

func RunWithTimeout(label string, timeout time.Duration, fn func() error) error {
	done := make(chan error, 1)
	go func() {
		done <- fn()
	}()

	select {
	case err := <-done:
		return err
	case <-time.After(timeout):
		log.Error().Str("operation", label).Dur("timeout", timeout).Msg("timed out")
		return fmt.Errorf("timed out running %s after %s", label, timeout)
	}
}

// CopyDir copies contents of fromDir to toDir.
// When keepParent is true, contents will be copied with their immediate parent dir,
// i.e. given /from/dirA and /to/dirB with keepParent == true, result will be /to/dirB/dirA/<children>
func CopyDir(fromDir, toDir string, keepParent bool) error {
	cleanedSourcePath := filepath.Clean(fromDir)
	parentDirectory := filepath.Dir(cleanedSourcePath)
	err := filepath.Walk(cleanedSourcePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		var destination string
		if keepParent {
			destination = JoinPaths(toDir, strings.TrimPrefix(path, parentDirectory))
		} else {
			destination = JoinPaths(toDir, strings.TrimPrefix(path, cleanedSourcePath))
		}

		if destination == "" {
			return nil
		}

		if info.IsDir() {
			return nil // skip directory creations
		}

		if !info.Mode().IsRegular() { // skip symlinks, FIFOs, sockets, devices
			return nil
		}

		return copyFile(path, destination)
	})

	return err
}

// copies regular a file from src to dst
func copyFile(src, dst string) error {
	from, err := os.Open(src)
	if err != nil {
		return err
	}
	defer logs.CloseAndLogErr(from)

	// has to include 'execute' bit, otherwise fails. MkdirAll follows `mkdir -m` restrictions
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}
	to, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer logs.CloseAndLogErr(to)

	_, err = io.Copy(to, from)
	return err
}
