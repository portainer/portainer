package edgeupdateschedules

import (
	"net/http"
	"os"
	"strings"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// @id AgentVersions
// @summary Fetches the supported versions of the agent to update/rollback
// @description
// @description **Access policy**: authenticated
// @tags edge_update_schedules
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} string
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /edge_update_schedules/agent_versions [get]
func (h *Handler) agentVersions(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	versions := []string{
		"2.13.0",
		"2.13.1",
		"2.14.0",
		"2.14.1",
		"2.14.2",
		"2.15.0",
		"2.15.1",
		"2.16.0",
	}

	env := os.Getenv("TEST_UPDATE_AGENT_VERSIONS")
	if env != "" {
		testVersions := strings.Split(env, ",")
		versions = append(versions, testVersions...)
	}

	return response.JSON(w, versions)
}
