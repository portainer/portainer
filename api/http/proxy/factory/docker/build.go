package docker

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"mime"
	"net/http"

	"github.com/portainer/portainer/api/archive"
)

type postDockerfileRequest struct {
	Content string
}

// buildOperation inspects the "Content-Type" header to determine if it needs to alter the request.
// If the value of the header is empty, it means that a Dockerfile is posted via upload, the function
// will extract the file content from the request body, tar it, and rewrite the body.
// If the value of the header contains "application/json", it means that the content of a Dockerfile is posted
// in the request payload as JSON, the function will create a new file called Dockerfile inside a tar archive and
// rewrite the body of the request.
// In any other case, it will leave the request unaltered.
func buildOperation(request *http.Request) error {
	contentTypeHeader := request.Header.Get("Content-Type")

	mediaType, _, err := mime.ParseMediaType(contentTypeHeader)
	if err != nil {
		return err
	}

	var buffer []byte
	switch mediaType {
	case "":
		body, err := ioutil.ReadAll(request.Body)
		if err != nil {
			return err
		}

		buffer, err = archive.TarFileInBuffer(body, "Dockerfile", 0600)
		if err != nil {
			return err
		}

	case "application/json":
		var req postDockerfileRequest
		if err := json.NewDecoder(request.Body).Decode(&req); err != nil {
			return err
		}

		buffer, err = archive.TarFileInBuffer([]byte(req.Content), "Dockerfile", 0600)
		if err != nil {
			return err
		}

	case "multipart/form-data":
		if request.MultipartForm.File == nil {
			return errors.New("uploaded files not found")
		}

		tfb := archive.NewTarFileInBuffer()
		defer tfb.Close()

		for k := range request.MultipartForm.File {
			f, hdr, err := request.FormFile(k)
			if err != nil {
				return err
			}

			defer f.Close()

			fmt.Printf("uploaded filename(%s), size[%d], header[%#v]\n", hdr.Filename, hdr.Size, hdr.Header)

			data := make([]byte, 0)
			if _, err := f.Read(data); err != nil {
				return err
			}

			tfb.Put(data, hdr.Filename, 0600)
		}

		buffer = tfb.Bytes()

	default:
		return nil
	}

	request.Body = ioutil.NopCloser(bytes.NewReader(buffer))
	request.ContentLength = int64(len(buffer))
	request.Header.Set("Content-Type", "application/x-tar")

	return nil
}
