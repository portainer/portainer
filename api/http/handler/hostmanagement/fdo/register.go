package fdo

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/sirupsen/logrus"
)

type registerDeviceResponse struct {
	Guid string `json:"guid" example:"c6ea3343-229a-4c07-9096-beef7134e1d3"`
}

// @id fdoRegisterDevice
// @summary register an FDO device
// @description register an FDO device
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /fdo/register [post]
func (handler *Handler) fdoRegisterDevice(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	// Post a voucher
	ov, filename, err := request.RetrieveMultiPartFormFile(r, "voucher")
	if err != nil {
		logrus.WithField("filename", filename).WithError(err).Info("fdoRegisterDevice: readVoucher()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoRegisterDevice: read Voucher()", Err: err}
	}

	fdoClient, err := handler.newFDOClient()
	if err != nil {
		logrus.WithError(err).Info("fdoRegisterDevice: newFDOClient()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoRegisterDevice: newFDOClient()", Err: err}
	}

	guid, err := fdoClient.PostVoucher(ov)
	if err != nil {
		logrus.WithError(err).Info("fdoRegisterDevice: PostVoucher()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoRegisterDevice: PostVoucher()", Err: err}
	}

	return response.JSON(w, registerDeviceResponse{guid})
}
