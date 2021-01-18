package status

import (
	"encoding/json"
	"net/http"

	"github.com/coreos/go-semver/semver"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/client"

	"github.com/portainer/libhttp/response"
)

type inspectVersionResponse struct {
	// Whether portainer has an update available
	UpdateAvailable bool `json:"UpdateAvailable" example:"false"`
	// The latest version available
	LatestVersion string `json:"LatestVersion" example:"2.0.0"`
}

type githubData struct {
	TagName string `json:"tag_name"`
}

// @id StatusInspectVersion
// @summary Check for portainer updates
// @description Check if portainer has an update available
// @description **Access policy**: authenticated
// @security jwt
// @tags status
// @produce json
// @success 200 {object} inspectVersionResponse "Success"
// @router /status/version [get]
func (handler *Handler) statusInspectVersion(w http.ResponseWriter, r *http.Request) {
	motd, err := client.Get(portainer.VersionCheckURL, 5)
	if err != nil {
		response.JSON(w, &inspectVersionResponse{UpdateAvailable: false})
		return
	}

	var data githubData
	err = json.Unmarshal(motd, &data)
	if err != nil {
		response.JSON(w, &inspectVersionResponse{UpdateAvailable: false})
		return
	}

	resp := inspectVersionResponse{
		UpdateAvailable: false,
	}

	currentVersion := semver.New(portainer.APIVersion)
	latestVersion := semver.New(data.TagName)
	if currentVersion.LessThan(*latestVersion) {
		resp.UpdateAvailable = true
		resp.LatestVersion = data.TagName
	}

	response.JSON(w, &resp)
}
