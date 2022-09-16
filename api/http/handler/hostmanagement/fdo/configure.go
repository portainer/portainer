package fdo

import (
	"encoding/hex"
	"errors"
	"net/http"
	"net/url"
	"strings"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"

	"github.com/fxamacker/cbor/v2"
	"github.com/rs/zerolog/log"
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
		log.Error().Err(err).Msg("fdoConfigureDevice: request.RetrieveRouteVariableValue()")

		return httperror.InternalServerError("fdoConfigureDevice: guid not found", err)
	}

	var payload deviceConfigurePayload

	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		log.Error().Err(err).Msg("invalid request payload")

		return httperror.BadRequest("Invalid request payload", err)
	}

	profile, err := handler.DataStore.FDOProfile().FDOProfile(portainer.FDOProfileID(payload.ProfileID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a FDO Profile with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a FDO Profile with the specified identifier inside the database", err)
	}

	fileContent, err := handler.FileService.GetFileContent(profile.FilePath, "")
	if err != nil {
		log.Error().Err(err).Msg("fdoConfigureDevice: GetFileContent")

		return httperror.InternalServerError("fdoConfigureDevice: GetFileContent", err)
	}

	fdoClient, err := handler.newFDOClient()
	if err != nil {
		log.Error().Err(err).Msg("fdoConfigureDevice: newFDOClient()")

		return httperror.InternalServerError("fdoConfigureDevice: newFDOClient()", err)
	}

	// enable fdo_sys
	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"0"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"active"},
		"bytes":    []string{"F5"}, // this is "true" in CBOR
	}, []byte("")); err != nil {
		log.Error().Err(err).Msg("fdoConfigureDevice: PutDeviceSVIRaw()")

		return httperror.InternalServerError("fdoConfigureDevice: PutDeviceSVIRaw()", err)
	}

	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"1"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"filedesc"},
		"filename": []string{"DEVICE_edgeid.txt"},
	}, []byte(payload.EdgeID)); err != nil {
		log.Error().Err(err).Msg("fdoConfigureDevice: PutDeviceSVIRaw(edgeid)")

		return httperror.InternalServerError("fdoConfigureDevice: PutDeviceSVIRaw(edgeid)", err)
	}

	// write down the edgekey
	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"1"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"filedesc"},
		"filename": []string{"DEVICE_edgekey.txt"},
	}, []byte(payload.EdgeKey)); err != nil {
		log.Error().Err(err).Msg("fdoConfigureDevice: PutDeviceSVIRaw(edgekey)")

		return httperror.InternalServerError("fdoConfigureDevice: PutDeviceSVIRaw(edgekey)", err)
	}

	// write down the device name
	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"1"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"filedesc"},
		"filename": []string{"DEVICE_name.txt"},
	}, []byte(payload.Name)); err != nil {
		log.Error().Err(err).Msg("fdoConfigureDevice: PutDeviceSVIRaw(name)")

		return httperror.InternalServerError("fdoConfigureDevice: PutDeviceSVIRaw(name)", err)
	}

	// write down the device GUID - used as the EDGE_DEVICE_GUID too
	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"1"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"filedesc"},
		"filename": []string{"DEVICE_GUID.txt"},
	}, []byte(guid)); err != nil {
		log.Error().Err(err).Msg("fdoConfigureDevice: PutDeviceSVIRaw()")

		return httperror.InternalServerError("fdoConfigureDevice: PutDeviceSVIRaw()", err)
	}

	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"1"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"filedesc"},
		"filename": []string{deploymentScriptName},
	}, fileContent); err != nil {
		log.Error().Err(err).Msg("fdoConfigureDevice: PutDeviceSVIRaw()")

		return httperror.InternalServerError("fdoConfigureDevice: PutDeviceSVIRaw()", err)
	}

	b, err := cbor.Marshal([]string{"/bin/sh", deploymentScriptName})
	if err != nil {
		log.Error().Err(err).Msg("failed to marshal string to CBOR")

		return httperror.InternalServerError("fdoConfigureDevice: PutDeviceSVIRaw() failed to encode", err)
	}

	cborBytes := strings.ToUpper(hex.EncodeToString(b))
	log.Debug().Str("cbor", cborBytes).Str("string", deploymentScriptName).Msg("converted to CBOR")

	if err = fdoClient.PutDeviceSVIRaw(url.Values{
		"guid":     []string{guid},
		"priority": []string{"2"},
		"module":   []string{"fdo_sys"},
		"var":      []string{"exec"},
		"bytes":    []string{cborBytes},
	}, []byte("")); err != nil {
		log.Error().Err(err).Msg("fdoConfigureDevice: PutDeviceSVIRaw()")

		return httperror.InternalServerError("fdoConfigureDevice: PutDeviceSVIRaw()", err)
	}

	return response.Empty(w)
}
