package upload

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
)

// UploadTLS godoc
// @summary Upload TLS file
// @description
// @tags Upload
// @security ApiKeyAuth
// @accept  multipart/form-data
// @produce  json
// @param certificate path string true "certificate type" Enums(ca,cert,key)
// @param folder query string true "folder name"
// @param file formData file true "file"
// @success 204
// @failure 400,500
// @router /upload/tls/{certificate} [post]
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
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid certificate route value. Value must be one of: ca, cert or key", filesystem.ErrUndefinedTLSFileType}
	}

	_, err = handler.FileService.StoreTLSFileFromBytes(folder, fileType, file)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist certificate file on disk", err}
	}

	return response.Empty(w)
}
