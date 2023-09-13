package filesystem

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/mod/semver"
)

type DirEntry struct {
	Name        string
	Content     string
	IsFile      bool
	Permissions os.FileMode
}

// FilterDirForEntryFile filers the given dirEntries, returns entries of the entryFile and .env file
func FilterDirForEntryFile(dirEntries []DirEntry, entryFile string) []DirEntry {
	var filteredDirEntries []DirEntry

	dotEnvFile := filepath.Join(filepath.Dir(entryFile), ".env")
	filters := []string{entryFile, dotEnvFile}

	for _, dirEntry := range dirEntries {
		match := false
		if dirEntry.IsFile {
			for _, filter := range filters {
				if filter == dirEntry.Name {
					match = true
					break
				}
			}
		} else {
			for _, filter := range filters {
				if strings.HasPrefix(filter, dirEntry.Name) {
					match = true
					break
				}
			}
		}
		if match {
			filteredDirEntries = append(filteredDirEntries, dirEntry)
		}
	}

	return filteredDirEntries
}

func FilterDirForCompatibility(dirEntries []DirEntry, entryFilePath, agentVersion string) (string, error) {

	if semver.Compare(fmt.Sprintf("v%s", agentVersion), "v2.19.0") == -1 {
		for _, dirEntry := range dirEntries {
			if dirEntry.IsFile {
				if dirEntry.Name == entryFilePath {
					return DecodeFileContent(dirEntry.Content)
				}
			}
		}
		return "", fmt.Errorf("Entry file %s not found in dir entries", entryFilePath)
	}

	return "", nil
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

				dirEntry.Content = base64.StdEncoding.EncodeToString(fileContent)
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

func DecodeFileContent(encodedFileContent string) (string, error) {
	decodedBytes, err := base64.StdEncoding.DecodeString(encodedFileContent)
	if err != nil {
		return "", err
	}
	return string(decodedBytes), nil
}

func DecodeDirEntries(dirEntries []DirEntry) error {
	for index, dirEntry := range dirEntries {
		if dirEntry.IsFile && dirEntry.Content != "" {
			decodedFile, err := DecodeFileContent(dirEntry.Content)
			if err != nil {
				return err
			}
			dirEntries[index].Content = decodedFile
		}
	}

	return nil
}
