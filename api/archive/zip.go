package archive

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/portainer/portainer/api/logs"

	"github.com/pkg/errors"
)

// UnzipFile will decompress a zip archive, moving all files and folders
// within the zip file (parameter 1) to an output directory (parameter 2).
func UnzipFile(src string, dest string) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer logs.CloseAndLogErr(r)

	for _, f := range r.File {
		p := filepath.Join(dest, f.Name)

		// Check for ZipSlip. More Info: http://bit.ly/2MsjAWE
		if !strings.HasPrefix(p, filepath.Clean(dest)+string(os.PathSeparator)) {
			return fmt.Errorf("%s: illegal file path", p)
		}

		if f.FileInfo().IsDir() {
			// Make Folder
			if err := os.MkdirAll(p, os.ModePerm); err != nil {
				return err
			}

			continue
		}

		if err := unzipFile(f, p); err != nil {
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
	defer logs.CloseAndLogErr(outFile)

	rc, err := f.Open()
	if err != nil {
		return errors.Wrapf(err, "unzipFile: can't open zip file %s in the archive", f.Name)
	}
	defer logs.CloseAndLogErr(rc)

	if _, err = io.Copy(outFile, rc); err != nil {
		return errors.Wrapf(err, "unzipFile: can't copy an archived file content")
	}

	return nil
}
