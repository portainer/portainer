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

// tarFileInBuffer represents a tar archive buffer.
type tarFileInBuffer struct {
	b *bytes.Buffer
	w *tar.Writer
}

func NewTarFileInBuffer() *tarFileInBuffer {
	var b bytes.Buffer
	return &tarFileInBuffer{
		b: &b,
		w: tar.NewWriter(&b),
	}
}

// Put puts a single file to tar archive buffer.
func (t *tarFileInBuffer) Put(fileContent []byte, fileName string, mode int64) error {
	hdr := &tar.Header{
		Name: fileName,
		Mode: mode,
		Size: int64(len(fileContent)),
	}

	if err := t.w.WriteHeader(hdr); err != nil {
		return err
	}

	if _, err := t.w.Write(fileContent); err != nil {
		return err
	}

	return nil
}

// Bytes returns the archive as a byte array.
func (t *tarFileInBuffer) Bytes() []byte {
	return t.b.Bytes()
}

func (t *tarFileInBuffer) Close() error {
	return t.w.Close()
}
