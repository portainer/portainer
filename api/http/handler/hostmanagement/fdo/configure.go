package fdo

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/fdo/ownerclient"
	"github.com/sirupsen/logrus"
)

// @id fdoConfigureDevice
// @summary configure an FDO device
// @description configure an FDO device
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /fdo/configure/{guid} [post]
func (handler *Handler) fdoConfigureDevice(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	fdoClient, err := handler.newFDOClient()
	if err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: newFDOClient()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: newFDOClient()", Err: err}
	}

	guid, err := request.RetrieveRouteVariableValue(r, "guid")
	if err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: request.RetrieveRouteVariableValue()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: guid not found", Err: err}
	}

	// Put ServiceInfo
	err = fdoClient.PutDeviceSVI(ownerclient.ServiceInfo{
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

	return response.Empty(w)
}
