package status

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/coreos/go-semver/semver"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/build"
	"github.com/portainer/portainer/api/http/client"

	"github.com/portainer/libhttp/response"
	log "github.com/sirupsen/logrus"
)

type versionResponse struct {
	// Whether portainer has an update available
	UpdateAvailable bool `json:"UpdateAvailable" example:"false"`
	// The latest version available
	LatestVersion string `json:"LatestVersion" example:"2.0.0"`

	ServerVersion   string
	DatabaseVersion string
	Build           BuildInfo
}

type BuildInfo struct {
	BuildNumber    string
	ImageTag       string
	NodejsVersion  string
	YarnVersion    string
	WebpackVersion string
	GoVersion      string
}

// @id Version
// @summary Check for portainer updates
// @description Check if portainer has an update available
// @description **Access policy**: authenticated
// @security ApiKeyAuth
// @security jwt
// @tags status
// @produce json
// @success 200 {object} versionResponse "Success"
// @router /status/version [get]
func (handler *Handler) version(w http.ResponseWriter, r *http.Request) {
	result := &versionResponse{
		ServerVersion:   portainer.APIVersion,
		DatabaseVersion: strconv.Itoa(portainer.DBVersion),
		Build: BuildInfo{
			BuildNumber:    build.BuildNumber,
			ImageTag:       build.ImageTag,
			NodejsVersion:  build.NodejsVersion,
			YarnVersion:    build.YarnVersion,
			WebpackVersion: build.WebpackVersion,
			GoVersion:      build.GoVersion,
		},
	}

	latestVersion := getLatestVersion()
	if hasNewerVersion(portainer.APIVersion, latestVersion) {
		result.UpdateAvailable = true
		result.LatestVersion = latestVersion
	}

	response.JSON(w, &result)
}

func getLatestVersion() string {
	motd, err := client.Get(portainer.VersionCheckURL, 5)
	if err != nil {
		log.WithError(err).Debug("couldn't fetch latest Portainer release version")
		return ""
	}

	var data struct {
		TagName string `json:"tag_name"`
	}

	err = json.Unmarshal(motd, &data)
	if err != nil {
		log.WithError(err).Debug("couldn't parse latest Portainer version")
		return ""
	}

	return data.TagName
}

func hasNewerVersion(currentVersion, latestVersion string) bool {
	currentVersionSemver, err := semver.NewVersion(currentVersion)
	if err != nil {
		log.WithField("version", currentVersion).Debug("current Portainer version isn't a semver")
		return false
	}

	latestVersionSemver, err := semver.NewVersion(latestVersion)
	if err != nil {
		log.WithField("version", latestVersion).Debug("latest Portainer version isn't a semver")
		return false
	}

	return currentVersionSemver.LessThan(*latestVersionSemver)
}
