package archive

import (
	"archive/tar"
	"bytes"
)

// TarFileInBuffer will create a tar archive containing a single file named via fileName and using the content
// specified in fileContent. Returns the archive as a byte array.
func TarFileInBuffer(fileContent []byte, fileName string, mode int64) ([]byte, error) {
	var buffer bytes.Buffer
	tarWriter := tar.NewWriter(&buffer)

	header := &tar.Header{
		Name: fileName,
		Mode: mode,
		Size: int64(len(fileContent)),
	}

	err := tarWriter.WriteHeader(header)
	if err != nil {
		return nil, err
	}

	_, err = tarWriter.Write(fileContent)
	if err != nil {
		return nil, err
	}

	err = tarWriter.Close()
	if err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}
