package upload

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

// POST request on /api/upload/tls/{certificate:(?:ca|cert|key)}?folder=<folder>
func (handler *Handler) uploadTLS(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	certificate, err := request.RetrieveRouteVariableValue(r, "certificate")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid certificate route variable", err}
	}

	folder, err := request.RetrieveMultiPartFormValue(r, "folder", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: folder", err}
	}

	file, _, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid certificate file. Ensure that the certificate file is uploaded correctly", err}
	}

	var fileType portainer.TLSFileType
	switch certificate {
	case "ca":
		fileType = portainer.TLSFileCA
	case "cert":
		fileType = portainer.TLSFileCert
	case "key":
		fileType = portainer.TLSFileKey
	default:
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid certificate route value. Value must be one of: ca, cert or key", portainer.ErrUndefinedTLSFileType}
	}

	_, err = handler.FileService.StoreTLSFileFromBytes(folder, fileType, file)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist certificate file on disk", err}
	}

	return response.Empty(w)
}
