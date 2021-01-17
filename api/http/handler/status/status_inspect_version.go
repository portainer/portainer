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
	UpdateAvailable bool   `json:"UpdateAvailable"`
	LatestVersion   string `json:"LatestVersion"`
}

type githubData struct {
	TagName string `json:"tag_name"`
}

// @summary Inspect Version
// @description
// @tags status
// @security ApiKeyAuth
// @accept json
// @produce json
// @success 200 {object} inspectVersionResponse "Version info"
// @failure 500
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
