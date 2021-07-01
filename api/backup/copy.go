package backup

import (
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func copyPath(path string, toDir string) error {
	info, err := os.Stat(path)
	if err != nil && errors.Is(err, os.ErrNotExist) {
		// skip copy if file does not exist
		return nil
	}

	if !info.IsDir() {
		destination := filepath.Join(toDir, info.Name())
		return copyFile(path, destination)
	}

	return copyDir(path, toDir)
}

func copyDir(fromDir, toDir string) error {
	cleanedSourcePath := filepath.Clean(fromDir)
	parentDirectory := filepath.Dir(cleanedSourcePath)
	err := filepath.Walk(cleanedSourcePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		destination := filepath.Join(toDir, strings.TrimPrefix(path, parentDirectory))
		if info.IsDir() {
			return nil // skip directory creations
		}

		if info.Mode()&os.ModeSymlink != 0 { // entry is a symlink
			return nil // don't copy symlinks
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
	defer from.Close()

	// has to include 'execute' bit, otherwise fails. MkdirAll follows `mkdir -m` restrictions
	if err := os.MkdirAll(filepath.Dir(dst), 0744); err != nil {
		return err
	}
	to, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer to.Close()

	_, err = io.Copy(to, from)
	return err
}
