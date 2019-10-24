package docker

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strings"

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
	if contentTypeHeader != "" && !strings.Contains(contentTypeHeader, "application/json") {
		return nil
	}

	var dockerfileContent []byte

	if contentTypeHeader == "" {
		body, err := ioutil.ReadAll(request.Body)
		if err != nil {
			return err
		}
		dockerfileContent = body
	} else {
		var req postDockerfileRequest
		if err := json.NewDecoder(request.Body).Decode(&req); err != nil {
			return err
		}
		dockerfileContent = []byte(req.Content)
	}

	buffer, err := archive.TarFileInBuffer(dockerfileContent, "Dockerfile", 0600)
	if err != nil {
		return err
	}

	request.Body = ioutil.NopCloser(bytes.NewReader(buffer))
	request.ContentLength = int64(len(buffer))
	request.Header.Set("Content-Type", "application/x-tar")

	return nil
}
