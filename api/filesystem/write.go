package filesystem

import (
	"os"
	"path/filepath"

	"github.com/pkg/errors"
)

// WriteToFile create a file in the filesystem storage
func (service *Service) WriteToFile(path string, data []byte) error {
	return WriteToFile(path, data)
}

// WriteToFile create a file in the filesystem storage
func WriteToFile(dst string, content []byte) error {
	if err := os.MkdirAll(filepath.Dir(dst), 0744); err != nil {
		return errors.Wrapf(err, "failed to create filestructure for the path %q", dst)
	}

	file, err := os.Create(dst)
	if err != nil {
		return errors.Wrapf(err, "failed to open a file %q", dst)
	}
	defer file.Close()

	_, err = file.Write(content)
	return errors.Wrapf(err, "failed to write a file %q", dst)
}
