package archive

import (
	"archive/zip"
	"bytes"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
)

// UnzipArchive will unzip an archive from bytes into the dest destination folder on disk
func UnzipArchive(archiveData []byte, dest string) error {
	zipReader, err := zip.NewReader(bytes.NewReader(archiveData), int64(len(archiveData)))
	if err != nil {
		return err
	}

	for _, zipFile := range zipReader.File {

		f, err := zipFile.Open()
		if err != nil {
			return err
		}
		defer f.Close()

		data, err := ioutil.ReadAll(f)
		if err != nil {
			return err
		}

		fpath := filepath.Join(dest, zipFile.Name)

		outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, zipFile.Mode())
		if err != nil {
			return err
		}

		_, err = io.Copy(outFile, bytes.NewReader(data))
		if err != nil {
			return err
		}

		outFile.Close()
	}

	return nil
}
