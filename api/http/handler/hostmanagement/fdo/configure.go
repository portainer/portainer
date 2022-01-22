package fdo

import (
	"encoding/hex"
	"errors"
	"net/http"
	"net/url"
	"strings"

	"github.com/fxamacker/cbor/v2"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

const (
	deploymentScriptName = "fdo.sh"
)

type deviceConfigurePayload struct {
	EdgeID    string `json:"edgeID"`
	EdgeKey   string `json:"edgeKey"`
	Name      string `json:"name"`
	ProfileID int    `json:"profile"`
}

func (payload *deviceConfigurePayload) Validate(r *http.Request) error {
	if payload.EdgeID == "" {
		return errors.New("invalid edge ID provided")
	}

	if payload.EdgeKey == "" {
		return errors.New("invalid edge key provided")
	}

	if payload.Name == "" {
		return errors.New("the device name cannot be empty")
	}

	if payload.ProfileID < 1 {
		return errors.New("invalid profile id provided")
	}

	return nil
}

// @id fdoConfigureDevice
// @summary configures an FDO device
// @description configures an FDO device
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @param body body deviceConfigurePayload true "Device Configuration"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /fdo/configure/{guid} [post]
func (handler *Handler) fdoConfigureDevice(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	guid, err := request.RetrieveRouteVariableValue(r, "guid")
	if err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: request.RetrieveRouteVariableValue()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: guid not found", Err: err}
	}

	var payload deviceConfigurePayload

	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		logrus.WithError(err).Error("Invalid request payload")
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	profile, err := handler.DataStore.FDOProfile().FDOProfile(portainer.FDOProfileID(payload.ProfileID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a FDO Profile with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a FDO Profile with the specified identifier inside the database", err}
	}

	fileContent, err := handler.FileService.GetFileContent(profile.FilePath, "")
	if err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: GetFileContent")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: GetFileContent", Err: err}
	}

	fdoClient, err := handler.newFDOClient()
	if err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: newFDOClient()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: newFDOClient()", Err: err}
	}

	// enable fdo_sys
	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"0"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"active"},
		"bytes":    []string{"F5"}, // this is "true" in CBOR
	}, []byte("")); err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: PutDeviceSVIRaw()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: PutDeviceSVIRaw()", Err: err}
	}

	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"1"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"filedesc"},
		"filename": []string{"DEVICE_edgeid.txt"},
	}, []byte(payload.EdgeID)); err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: PutDeviceSVIRaw(edgeid)")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: PutDeviceSVIRaw(edgeid)", Err: err}
	}

	// write down the edgekey
	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"1"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"filedesc"},
		"filename": []string{"DEVICE_edgekey.txt"},
	}, []byte(payload.EdgeKey)); err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: PutDeviceSVIRaw(edgekey)")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: PutDeviceSVIRaw(edgekey)", Err: err}
	}

	// write down the device name
	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"1"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"filedesc"},
		"filename": []string{"DEVICE_name.txt"},
	}, []byte(payload.Name)); err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: PutDeviceSVIRaw(name)")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: PutDeviceSVIRaw(name)", Err: err}
	}

	// write down the device GUID - used as the EDGE_DEVICE_GUID too
	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"1"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"filedesc"},
		"filename": []string{"DEVICE_GUID.txt"},
	}, []byte(guid)); err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: PutDeviceSVIRaw()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: PutDeviceSVIRaw()", Err: err}
	}

	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"1"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"filedesc"},
		"filename": []string{deploymentScriptName},
	}, fileContent); err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: PutDeviceSVIRaw()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: PutDeviceSVIRaw()", Err: err}
	}

	b, err := cbor.Marshal([]string{"/bin/sh", deploymentScriptName})
	if err != nil {
		logrus.WithError(err).Error("failed to marshal string to CBOR")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: PutDeviceSVIRaw() failed to encode", Err: err}
	}

	cborBytes := strings.ToUpper(hex.EncodeToString(b))
	logrus.WithField("cbor", cborBytes).WithField("string", deploymentScriptName).Info("converted to CBOR")

	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"2"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"exec"},
		"bytes":    []string{cborBytes},
	}, []byte("")); err != nil {
		logrus.WithError(err).Info("fdoConfigureDevice: PutDeviceSVIRaw()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoConfigureDevice: PutDeviceSVIRaw()", Err: err}
	}

	return response.Empty(w)
}
