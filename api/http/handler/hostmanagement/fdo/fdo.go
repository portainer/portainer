package fdo

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/hostmanagement/fdo"
	"github.com/sirupsen/logrus"
)

type fdoConfigurePayload portainer.FDOConfiguration

func validateURL(u string) error {
	p, err := url.Parse(u)
	if err != nil {
		return err
	}

	if p.Scheme != "http" && p.Scheme != "https" {
		return errors.New("invalid scheme provided, must be 'http' or 'https'")
	}

	if p.Host == "" {
		return errors.New("invalid host provided")
	}

	return nil
}

func (payload *fdoConfigurePayload) Validate(r *http.Request) error {
	if payload.Enabled {
		if err := validateURL(payload.OwnerURL); err != nil {
			return fmt.Errorf("owner server URL: %w", err)
		}
	}

	return nil
}

func (handler *Handler) saveSettings(config portainer.FDOConfiguration) error {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return err
	}
	settings.FDOConfiguration = config

	return handler.DataStore.Settings().UpdateSettings(settings)
}

func (handler *Handler) newFDOClient() (fdo.FDOOwnerClient, error) {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return fdo.FDOOwnerClient{}, err
	}

	return fdo.FDOOwnerClient{
		OwnerURL: settings.FDOConfiguration.OwnerURL,
		Username: settings.FDOConfiguration.OwnerUsername,
		Password: settings.FDOConfiguration.OwnerPassword,
		Timeout:  5 * time.Second,
	}, nil
}

// @id fdoConfigure
// @summary Enable Portainer's FDO capabilities
// @description Enable Portainer's FDO capabilities
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @accept json
// @produce json
// @param body body fdoConfigurePayload true "FDO Settings"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /fdo [post]
func (handler *Handler) fdoConfigure(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload fdoConfigurePayload

	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		logrus.WithError(err).Error("Invalid request payload")
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	settings := portainer.FDOConfiguration(payload)
	if err = handler.saveSettings(settings); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Error saving FDO settings", Err: err}
	}

	profiles, err := handler.DataStore.FDOProfile().FDOProfiles()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Error saving FDO settings", Err: err}
	}
	if len(profiles) == 0 {
		err = handler.addDefaultProfile()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
		}
	}

	return response.Empty(w)
}

func (handler *Handler) addDefaultProfile() error {
	profileID := handler.DataStore.FDOProfile().GetNextIdentifier()
	profile := &portainer.FDOProfile{
		ID:   portainer.FDOProfileID(profileID),
		Name: "Docker Standalone + Edge",
	}

	filePath, err := handler.FileService.StoreFDOProfileFileFromBytes(strconv.Itoa(int(profile.ID)), []byte(defaultProfileFileContent))
	if err != nil {
		return err
	}
	profile.FilePath = filePath
	profile.DateCreated = time.Now().Unix()

	err = handler.DataStore.FDOProfile().Create(profile)
	if err != nil {
		return err
	}
	return nil
}

const defaultProfileFileContent = `
#!/bin/bash -ex

env > env.log

export AGENT_IMAGE=portainer/agent:2.11.0
export GUID=$(cat DEVICE_GUID.txt)
export DEVICE_NAME=$(cat DEVICE_name.txt)
export EDGE_ID=$(cat DEVICE_edgeid.txt)
export EDGE_KEY=$(cat DEVICE_edgekey.txt)
export AGENTVOLUME=$(pwd)/data/portainer_agent_data/

mkdir -p ${AGENTVOLUME}

docker pull ${AGENT_IMAGE}

docker run -d \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /var/lib/docker/volumes:/var/lib/docker/volumes \
    -v /:/host \
    -v ${AGENTVOLUME}:/data \
    --restart always \
    -e EDGE=1 \
    -e EDGE_ID=${EDGE_ID} \
    -e EDGE_KEY=${EDGE_KEY} \
    -e CAP_HOST_MANAGEMENT=1 \
    -e EDGE_INSECURE_POLL=1 \
    --name portainer_edge_agent \
    ${AGENT_IMAGE}
`
