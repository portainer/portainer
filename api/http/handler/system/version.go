package system

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/client"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/pkg/build"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/coreos/go-semver/semver"
	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
)

type versionResponse struct {
	// Whether portainer has an update available
	UpdateAvailable bool `json:"UpdateAvailable" example:"false"`
	// The latest version available
	LatestVersion string `json:"LatestVersion" example:"2.0.0"`

	ServerVersion   string
	VersionSupport  string `json:"VersionSupport" example:"STS/LTS"`
	ServerEdition   string `json:"ServerEdition" example:"CE/EE"`
	DatabaseVersion string
	Build           build.BuildInfo
	Dependencies    build.DependenciesInfo
	Runtime         build.RuntimeInfo
}

// @id systemVersion
// @summary Check for portainer updates
// @description Check if portainer has an update available
// @description **Access policy**: authenticated
// @security ApiKeyAuth
// @security jwt
// @tags system
// @produce json
// @success 200 {object} versionResponse "Success"
// @router /system/version [get]
func (handler *Handler) version(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	isAdmin, err := security.IsAdmin(r)
	if err != nil {
		return httperror.Forbidden("Permission denied to access Portainer", err)
	}

	result := &versionResponse{
		ServerVersion:   portainer.APIVersion,
		VersionSupport:  portainer.APIVersionSupport,
		DatabaseVersion: portainer.APIVersion,
		ServerEdition:   portainer.Edition.GetEditionLabel(),
		Build:           build.GetBuildInfo(),
		Dependencies:    build.GetDependenciesInfo(),
	}

	if isAdmin {
		result.Runtime = build.GetRuntimeInfo()
	}

	latestVersion := GetLatestVersion()
	if HasNewerVersion(portainer.APIVersion, latestVersion) {
		result.UpdateAvailable = true
		result.LatestVersion = latestVersion
	}

	return response.JSON(w, &result)
}

func GetLatestVersion() string {
	motd, err := client.Get(portainer.VersionCheckURL, 5)
	if err != nil {
		log.Debug().Err(err).Msg("couldn't fetch latest Portainer release version")

		return ""
	}

	var data struct {
		TagName string `json:"tag_name"`
	}

	if err := json.Unmarshal(motd, &data); err != nil {
		log.Debug().Err(err).Msg("couldn't parse latest Portainer version")

		return ""
	}

	return data.TagName
}

func HasNewerVersion(currentVersion, latestVersion string) bool {
	currentVersionSemver, err := semver.NewVersion(currentVersion)
	if err != nil {
		log.Debug().Str("version", currentVersion).Msg("current Portainer version isn't a semver")

		return false
	}

	latestVersionSemver, err := semver.NewVersion(latestVersion)
	if err != nil {
		log.Debug().Str("version", latestVersion).Msg("latest Portainer version isn't a semver")

		return false
	}

	return currentVersionSemver.LessThan(*latestVersionSemver)
}
