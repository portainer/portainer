package fdo

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/fdo/ownerclient"
	"github.com/sirupsen/logrus"
)

// @id fdoRegisterDevice
// @summary register an FDO device
// @description Request OpenAMT info from a node
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /hosts/fdo/register [post]
func (handler *Handler) fdoRegisterDevice(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	// Post a voucher

	// TODO: get voucher from file upload
	//ov, err := ioutil.ReadFile("d064b879.ov")
	ov, filename, err := request.RetrieveMultiPartFormFile(r, "voucher")
	if err != nil {
		logrus.WithField("filename", filename).WithError(err).Info("fdoRegisterDevice: readVoucher()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoRegisterDevice: read Voucher()", Err: err}
	}

	guid, err := handler.fdoClient.PostVoucher(ov)
	if err != nil {
		logrus.WithError(err).Info("fdoRegisterDevice: PostVoucher()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoRegisterDevice: PostVoucher()", Err: err}
	}

	// Put ServiceInfo
	err = handler.fdoClient.PutDeviceSVI(ownerclient.ServiceInfo{
		Module:   "test-module",
		Var:      "test-var",
		Filename: "test-filename",
		Bytes:    []byte("test-bytes"),
		GUID:     guid,
		Device:   "test-device-model",
		Priority: 1,
		OS:       "Test OS",
		Version:  "21.11",
		Arch:     "X86_64",
		CRID:     123,
		Hash:     "test-hash",
	})

	if err != nil {
		logrus.WithError(err).Info("fdoRegisterDevice: PutDeviceSVI()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoRegisterDevice: PutDeviceSVI()", Err: err}
	}

	// Get device ServiceInfo
	svinfo, err := handler.fdoClient.GetDeviceSVI(guid)
	if err != nil {
		logrus.WithError(err).Info("fdoRegisterDevice: GetDeviceSVI()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoRegisterDevice: GetDeviceSVI()", Err: err}
	}

	logrus.WithField("Service info", svinfo).Debug("fdoRegisterDevice ok")

	return response.JSON(w, svinfo)
}
