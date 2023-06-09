package filesystem

import (
	"encoding/base64"
	"os"
	"path/filepath"
)

type DirEntry struct {
	Name        string
	Content     string
	IsFile      bool
	Permissions os.FileMode
}

// LoadDir reads all files and folders recursively from the given directory
// File content is base64-encoded
func LoadDir(dir string) ([]DirEntry, error) {
	var dirEntries []DirEntry

	err := filepath.WalkDir(
		dir,
		func(path string, d os.DirEntry, err error) error {
			if err != nil {
				return err
			}

			fileInfo, err := d.Info()
			if err != nil {
				return err
			}

			relativePath, err := filepath.Rel(dir, path)
			if err != nil {
				return err
			}
			if relativePath == "." {
				return nil
			}

			dirEntry := DirEntry{
				Name:        relativePath,
				Permissions: fileInfo.Mode().Perm(),
			}

			if !fileInfo.IsDir() {
				// Read file contents
				fileContent, err := os.ReadFile(path)
				if err != nil {
					return err
				}

				dirEntry.Content = string(base64.StdEncoding.EncodeToString(fileContent))
				dirEntry.IsFile = true
			}

			dirEntries = append(dirEntries, dirEntry)
			return nil
		})

	if err != nil {
		return nil, err
	}

	return dirEntries, nil
}

// PersistDir writes the provided array of files and folders back to the given directory.
func PersistDir(dir string, dirEntries []DirEntry) error {
	for _, dirEntry := range dirEntries {
		path := filepath.Join(dir, dirEntry.Name)

		if dirEntry.IsFile {
			// Create the directory path if it doesn't exist
			err := os.MkdirAll(filepath.Dir(path), 0744)
			if err != nil {
				return err
			}

			// Write file contents
			err = os.WriteFile(path, []byte(dirEntry.Content), dirEntry.Permissions)
			if err != nil {
				return err
			}
		} else {
			// Create the directory
			err := os.MkdirAll(path, dirEntry.Permissions)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func DecodeDirEntries(dirEntries []DirEntry) error {
	for index, dirEntry := range dirEntries {
		if dirEntry.IsFile && dirEntry.Content != "" {
			decodedBytes, err := base64.StdEncoding.DecodeString(dirEntry.Content)
			if err != nil {
				return err
			}
			dirEntries[index].Content = string(decodedBytes)
		}
	}

	return nil
}
