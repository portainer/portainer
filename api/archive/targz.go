package archive

import (
	"archive/tar"
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// TarGzDir creates a tar.gz archive and returns it's path.
// abosolutePath should be an absolute path to a directory.
// Archive name will be <directoryName>.tar.gz and will be placed next to the directory.
func TarGzDir(absolutePath string) (string, error) {
	targzPath := filepath.Join(absolutePath, fmt.Sprintf("%s.tar.gz", filepath.Base(absolutePath)))
	outFile, err := os.Create(targzPath)
	if err != nil {
		return "", err
	}
	defer outFile.Close()

	zipWriter := gzip.NewWriter(outFile)
	defer zipWriter.Close()
	tarWriter := tar.NewWriter(zipWriter)
	defer tarWriter.Close()

	err = filepath.Walk(absolutePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if path == targzPath {
			return nil // skip archive file
		}

		pathInArchive := filepath.Clean(strings.TrimPrefix(path, absolutePath))
		if pathInArchive == "" {
			return nil // skip root dir
		}

		return addToArchive(tarWriter, pathInArchive, path, info)
	})

	return targzPath, err
}

func addToArchive(tarWriter *tar.Writer, pathInArchive string, path string, info os.FileInfo) error {
	header, err := tar.FileInfoHeader(info, info.Name())
	if err != nil {
		return err
	}

	header.Name = pathInArchive // use relative paths in archive

	err = tarWriter.WriteHeader(header)
	if err != nil {
		return err
	}

	if info.IsDir() {
		return nil
	}

	file, err := os.Open(path)
	if err != nil {
		return err
	}
	_, err = io.Copy(tarWriter, file)
	return err
}

// ExtractTarGz reads a .tar.gz archive from the reader and extracts it into outputDirPath directory
func ExtractTarGz(r io.Reader, outputDirPath string) error {
	zipReader, err := gzip.NewReader(r)
	if err != nil {
		return err
	}
	defer zipReader.Close()

	tarReader := tar.NewReader(zipReader)

	for {
		header, err := tarReader.Next()

		if err == io.EOF {
			break
		}

		if err != nil {
			return err
		}

		switch header.Typeflag {
		case tar.TypeDir:
			// skip, dir will be created with a file
		case tar.TypeReg:
			p := filepath.Clean(filepath.Join(outputDirPath, header.Name))
			if err := os.MkdirAll(filepath.Dir(p), 0744); err != nil {
				return fmt.Errorf("Failed to extract dir %s", filepath.Dir(p))
			}
			outFile, err := os.Create(p)
			if err != nil {
				return fmt.Errorf("Failed to create file %s", header.Name)
			}
			if _, err := io.Copy(outFile, tarReader); err != nil {
				return fmt.Errorf("Failed to extract file %s", header.Name)
			}
			outFile.Close()
		default:
			return fmt.Errorf("Tar: uknown type: %v in %s",
				header.Typeflag,
				header.Name)
		}
	}

	return nil
}
