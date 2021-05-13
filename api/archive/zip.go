package archive

import (
	"archive/zip"
	"bytes"
	"fmt"
	"github.com/pkg/errors"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
)

// UnzipArchive will unzip an archive from bytes into the dest destination folder on disk
func UnzipArchive(archiveData []byte, dest string) error {
	zipReader, err := zip.NewReader(bytes.NewReader(archiveData), int64(len(archiveData)))
	if err != nil {
		return err
	}

	for _, zipFile := range zipReader.File {
		err := extractFileFromArchive(zipFile, dest)
		if err != nil {
			return err
		}
	}

	return nil
}

func extractFileFromArchive(file *zip.File, dest string) error {
	f, err := file.Open()
	if err != nil {
		return err
	}
	defer f.Close()

	data, err := ioutil.ReadAll(f)
	if err != nil {
		return err
	}

	fpath := filepath.Join(dest, file.Name)

	outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
	if err != nil {
		return err
	}

	_, err = io.Copy(outFile, bytes.NewReader(data))
	if err != nil {
		return err
	}

	return outFile.Close()
}

// UnzipFile will decompress a zip archive, moving all files and folders
// within the zip file (parameter 1) to an output directory (parameter 2).
func UnzipFile(src string, dest string) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		p := filepath.Join(dest, f.Name)

		// Check for ZipSlip. More Info: http://bit.ly/2MsjAWE
		if !strings.HasPrefix(p, filepath.Clean(dest)+string(os.PathSeparator)) {
			return fmt.Errorf("%s: illegal file path", p)
		}

		if f.FileInfo().IsDir() {
			// Make Folder
			os.MkdirAll(p, os.ModePerm)
			continue
		}

		err = unzipFile(f, p)
		if err != nil {
			return err
		}
	}

	return nil
}

func unzipFile(f *zip.File, p string) error {
	// Make File
	if err := os.MkdirAll(filepath.Dir(p), os.ModePerm); err != nil {
		return errors.Wrapf(err, "unzipFile: can't make a path %s", p)
	}
	outFile, err := os.OpenFile(p, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
	if err != nil {
		return errors.Wrapf(err, "unzipFile: can't create file %s", p)
	}
	defer outFile.Close()
	rc, err := f.Open()
	if err != nil {
		return errors.Wrapf(err, "unzipFile: can't open zip file %s in the archive", f.Name)
	}
	defer rc.Close()

	_, err = io.Copy(outFile, rc)

	if err != nil {
		return errors.Wrapf(err, "unzipFile: can't copy an archived file content")
	}

	return nil
}
