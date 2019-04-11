package security

import (
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/portainer/portainer/api"
)

var dockerRule = regexp.MustCompile(`/(?P<identifier>\d+)/docker(?P<operation>/.*)`)
var registryRule = regexp.MustCompile(`/registries/(?P<identifier>\d+)/v2(?P<operation>/.*)?`)

func extractMatches(regex *regexp.Regexp, str string) map[string]string {
	match := regex.FindStringSubmatch(str)

	results := map[string]string{}
	for i, name := range match {
		results[regex.SubexpNames()[i]] = name
	}
	return results
}

func extractResourceAndActionFromURL(routeResource, url string) (string, string) {
	routePattern := regexp.MustCompile(`/` + routeResource + `/(?P<resource>[^/]*)/?(?P<action>.*)?`)
	urlComponents := extractMatches(routePattern, url)

	// TODO: optional log statement for debug
	//fmt.Printf("IMAGE OPERATION: %s,%s | resource: %s | action: %s\n", method, url, urlComponents["resource"], urlComponents["action"])

	return urlComponents["resource"], urlComponents["action"]
}

func checkPermissions(r *http.Request) error {
	tokenData, err := RetrieveTokenData(r)
	if err != nil {
		return err
	}

	authorized := authorizedOperation(r, tokenData.Authorizations)
	if !authorized {
		return portainer.ErrAuthorizationRequired
	}

	return nil
}

func authorizedOperation(r *http.Request, authorizations portainer.Authorizations) bool {
	log.Printf("RBAC | Permission check for %s - %s", r.Method, r.URL.String())
	operationAuthorization := getOperationAuthorization(r.URL.String(), r.Method)
	return authorizations[operationAuthorization]
}

func getOperationAuthorization(url, method string) portainer.Authorization {
	if dockerRule.MatchString(url) {
		match := dockerRule.FindStringSubmatch(url)
		return getDockerOperationAuthorization(strings.TrimPrefix(url, "/"+match[1]+"/docker"), method)
	} else if registryRule.MatchString(url) {
		return getRegistryOperationAuthorization(url, method)
	}
	return getPortainerOperationAuthorization(url, method)
}

func getRegistryOperationAuthorization(url, method string) portainer.Authorization {
	fmt.Printf("Registry operation: %s,%s\n", method, url)

	//urlParts := strings.Split(url, "/")
	//baseResource := urlParts[1]

	permission := portainer.OperationPortainerAdmin

	return permission
}

func getPortainerOperationAuthorization(url, method string) portainer.Authorization {
	fmt.Printf("Portainer operation: %s,%s\n", method, url)

	urlParts := strings.Split(url, "/")
	baseResource := urlParts[1]

	// TODO: consider public endpoints evolutions?
	// right now, "status" and "auth" are not processed as they expose
	// public endpoints. But what happens if we add POST "/status/newfeature" in the future?

	switch baseResource {
	case "dockerhub":
		return portainerDockerhubOperationAuthorization(url, method)
	case "endpoint_groups":
		return portainerEndpointGroupOperationAuthorization(url, method)
	case "endpoints":
		return portainerEndpointOperationAuthorization(url, method)
	case "motd":
		return portainer.OperationPortainerMOTD
	case "extensions":
		return portainerExtensionOperationAuthorization(url, method)
	case "registries":
		return portainerRegistryOperationAuthorization(url, method)
	case "resource_controls":
		return portainerResourceControlOperationAuthorization(url, method)
	case "roles":
		return portainerRoleOperationAuthorization(url, method)
	case "schedules":
		return portainerScheduleOperationAuthorization(url, method)
	case "settings":
		return portainerSettingsOperationAuthorization(url, method)
	case "stacks":
		return portainerStackOperationAuthorization(url, method)
	case "tags":
		return portainerTagOperationAuthorization(url, method)
	case "templates":
		return portainerTemplatesOperationAuthorization(url, method)
	case "upload":
		return portainerUploadOperationAuthorization(url, method)
	case "users":
		return portainerUserOperationAuthorization(url, method)
	case "teams":
		return portainerTeamOperationAuthorization(url, method)
	case "team_memberships":
		return portainerTeamMembershipOperationAuthorization(url, method)
	case "websocket":
		return portainerWebsocketOperationAuthorization(url, method)
	case "webhooks":
		return portainerWebhookOperationAuthorization(url, method)
	}

	return portainer.OperationPortainerAdmin
}

func getDockerOperationAuthorization(url, method string) portainer.Authorization {
	urlParts := strings.Split(url, "/")
	baseResource := urlParts[1]

	switch baseResource {
	case "containers":
		return dockerContainerOperationAuthorization(url, method)
	case "images":
		return dockerImageOperationAuthorization(url, method)
	case "networks":
		return dockerNetworkOperationAuthorization(url, method)
	case "volumes":
		return dockerVolumeOperationAuthorization(url, method)
	case "exec":
		return dockerExecOperationAuthorization(url, method)
	case "swarm":
		return dockerSwarmOperationAuthorization(url, method)
	case "nodes":
		return dockerNodeOperationAuthorization(url, method)
	case "services":
		return dockerServiceOperationAuthorization(url, method)
	case "secrets":
		return dockerSecretOperationAuthorization(url, method)
	case "configs":
		return dockerConfigOperationAuthorization(url, method)
	case "tasks":
		return dockerTaskOperationAuthorization(url, method)
	case "plugins":
		return dockerPluginOperationAuthorization(url, method)
	case "info":
		return portainer.OperationDockerInfo
		//return dockerInfoOperationAuthorization(url, method)
	case "_ping":
		//return dockerPingOperationAuthorization(url, method)
		return portainer.OperationDockerPing
	case "version":
		return portainer.OperationDockerVersion
	case "events":
		return portainer.OperationDockerEvents
	case "system/df":
		return portainer.OperationDockerSystem
	case "session":
		return dockerSessionOperationAuthorization(url, method)
	case "distribution":
		return dockerDistributionOperationAuthorization(url, method)
	case "commit":
		return dockerCommitOperationAuthorization(url, method)
		//return portainer.OperationDockerCommit
	case "build":
		return dockerBuildOperationAuthorization(url, method)
		//return portainer.OperationDockerBuilds
	default:
		// TODO: review default
		// should have a generic role for unsupported (future resources in the Docker API)
		return portainer.OperationPortainerAdmin
	}
}

func portainerDockerhubOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("dockerhub", url)

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerDockerHubInspect
		}
	case http.MethodPut:
		if resource == "" && action == "" {
			return portainer.OperationPortainerDockerHubUpdate
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerEndpointGroupOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("endpoint_groups", url)

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerEndpointGroupList
		} else if resource != "" && action == "" {
			return portainer.OperationPortainerEndpointGroupInspect
		}
	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerEndpointGroupCreate
		}
	case http.MethodPut:
		if resource != "" && action == "" {
			return portainer.OperationPortainerEndpointGroupUpdate
		} else if action == "access" {
			return portainer.OperationPortainerEndpointGroupAccess
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerEndpointGroupDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerEndpointOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("endpoints", url)

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerEndpointList
		} else if resource != "" && action == "" {
			return portainer.OperationPortainerEndpointInspect
		}
	case http.MethodPost:
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationPortainerEndpointCreate
			}
		case "extensions":
			return portainer.OperationPortainerEndpointExtensionAdd
		case "job":
			return portainer.OperationPortainerEndpointJob
		case "snapshot":
			if resource == "" {
				return portainer.OperationPortainerEndpointSnapshots
			} else if resource != "" {
				return portainer.OperationPortainerEndpointSnapshot
			}
		}
	case http.MethodPut:
		if resource != "" && action == "" {
			return portainer.OperationPortainerEndpointUpdate
		} else if action == "access" {
			return portainer.OperationPortainerEndpointUpdateAccess
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerEndpointDelete
			// TODO: check this one works
		} else if resource == "extensions" {
			return portainer.OperationPortainerEndpointExtensionRemove
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerExtensionOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("extensions", url)

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerExtensionList
		} else if resource != "" && action == "" {
			return portainer.OperationPortainerExtensionInspect
		}
	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerExtensionCreate
		} else if action == "update" {
			return portainer.OperationPortainerExtensionUpdate
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerExtensionDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerRegistryOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("registries", url)

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerRegistryList
		} else if resource != "" && action == "" {
			return portainer.OperationPortainerRegistryInspect
		}
	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerRegistryCreate
		} else if action == "configure" {
			return portainer.OperationPortainerRegistryConfigure
		}
	case http.MethodPut:
		if resource != "" && action == "" {
			return portainer.OperationPortainerRegistryUpdate
		} else if action == "access" {
			return portainer.OperationPortainerRegistryUpdateAccess
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerRegistryDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerResourceControlOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("resource_controls", url)

	switch method {
	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerResourceControlCreate
		}
	case http.MethodPut:
		if resource != "" && action == "" {
			return portainer.OperationPortainerResourceControlUpdate
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerResourceControlDelete
		}
	}
	return portainer.OperationPortainerAdmin
}

func portainerRoleOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("roles", url)

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerRoleList
		} else if resource != "" && action == "" {
			return portainer.OperationPortainerRoleInspect
		}
	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerRoleCreate
		}
	case http.MethodPut:
		if resource != "" && action == "" {
			return portainer.OperationPortainerRoleUpdate
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerRoleDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerScheduleOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("schedules", url)

	switch method {
	case http.MethodGet:
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationPortainerScheduleList
			} else {
				return portainer.OperationPortainerScheduleInspect
			}
		case "file":
			return portainer.OperationPortainerScheduleFile
		case "tasks":
			return portainer.OperationPortainerScheduleTasks
		}

	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerScheduleCreate
		}
	case http.MethodPut:
		if resource != "" && action == "" {
			return portainer.OperationPortainerScheduleUpdate
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerScheduleDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerSettingsOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("settings", url)

	// TODO: /settings/public is a public endpoint

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerSettingsInspect
		}
	case http.MethodPut:
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationPortainerSettingsUpdate
			}
			// TODO: validate this case will work for /settings/authentication/checkLDAP
		case "checkLDAP":
			return portainer.OperationPortainerSettingsLDAPCheck
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerStackOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("stacks", url)

	switch method {
	case http.MethodGet:
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationPortainerStackList
			} else {
				return portainer.OperationPortainerStackInspect
			}
		case "file":
			return portainer.OperationPortainerStackFile
		}

	case http.MethodPost:
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationPortainerStackCreate
			}
		case "migrate":
			return portainer.OperationPortainerStackMigrate
		}

	case http.MethodPut:
		if resource != "" && action == "" {
			return portainer.OperationPortainerStackUpdate
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerStackDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerTagOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("tags", url)

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerTagList
		}
	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerTagCreate
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerTagDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerTeamMembershipOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("team_memberships", url)

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerTeamMembershipList
		}
	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerTeamMembershipCreate
		}
	case http.MethodPut:
		if resource != "" && action == "" {
			return portainer.OperationPortainerTeamMembershipUpdate
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerTeamMembershipDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerTeamOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("teams", url)

	switch method {
	case http.MethodGet:
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationPortainerTeamList
			} else {
				return portainer.OperationPortainerTeamInspect
			}
		case "memberships":
			return portainer.OperationPortainerTeamMemberships
		}

	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerTeamCreate
		}
	case http.MethodPut:
		if resource != "" && action == "" {
			return portainer.OperationPortainerTeamUpdate
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerTeamDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerTemplatesOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("templates", url)

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerTemplateList
		} else if resource != "" && action == "" {
			return portainer.OperationPortainerTemplateInspect
		}
	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerTemplateCreate
		}
	case http.MethodPut:
		if resource != "" && action == "" {
			return portainer.OperationPortainerTemplateUpdate
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerTemplateDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerUploadOperationAuthorization(url, method string) portainer.Authorization {
	resource, _ := extractResourceAndActionFromURL("upload", url)

	switch method {
	case http.MethodPost:
		if resource == "tls" {
			return portainer.OperationPortainerUploadTLS
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerUserOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("users", url)

	switch method {
	case http.MethodGet:
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationPortainerUserList
			} else {
				return portainer.OperationPortainerUserInspect
			}
		case "memberships":
			return portainer.OperationPortainerUserMemberships
		}

	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerUserCreate
		}
	case http.MethodPut:
		if resource != "" && action == "" {
			return portainer.OperationPortainerUserUpdate
		} else if resource != "" && action == "passwd" {
			return portainer.OperationPortainerUserUpdatePassword
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerUserDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

func portainerWebsocketOperationAuthorization(url, method string) portainer.Authorization {
	resource, _ := extractResourceAndActionFromURL("websocket", url)

	if resource == "exec" {
		return portainer.OperationPortainerWebsocketExec
	}

	return portainer.OperationPortainerAdmin
}

func portainerWebhookOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("webhooks", url)

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerWebhookList
		}
	case http.MethodPost:
		if resource == "" && action == "" {
			return portainer.OperationPortainerWebhookCreate
		}
	case http.MethodDelete:
		if resource != "" && action == "" {
			return portainer.OperationPortainerWebhookDelete
		}
	}

	return portainer.OperationPortainerAdmin
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/network/network.go#L29
func dockerNetworkOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("networks", url)

	switch method {
	case http.MethodGet:
		// GET
		//router.NewGetRoute("/networks", r.getNetworksList),
		//router.NewGetRoute("/networks/", r.getNetworksList),
		//router.NewGetRoute("/networks/{id:.+}", r.getNetwork),
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationDockerNetworkList
			} else {
				return portainer.OperationDockerNetworkInspect
			}
		}
	case http.MethodPost:
		//router.NewPostRoute("/networks/create", r.postNetworkCreate),
		//router.NewPostRoute("/networks/{id:.*}/connect", r.postNetworkConnect),
		//router.NewPostRoute("/networks/{id:.*}/disconnect", r.postNetworkDisconnect),
		//router.NewPostRoute("/networks/prune", r.postNetworksPrune),
		switch action {
		case "":
			if resource == "create" {
				return portainer.OperationDockerNetworkCreate
			} else if resource == "prune" {
				return portainer.OperationDockerNetworkPrune
			}
		case "connect":
			return portainer.OperationDockerNetworkConnect
		case "disconnect":
			return portainer.OperationDockerNetworkDisconnect
		}
	case http.MethodDelete:
		// DELETE
		// 	router.NewDeleteRoute("/networks/{id:.*}", r.deleteNetwork),
		if resource != "" && action == "" {
			return portainer.OperationDockerNetworkDelete
		}
	}

	return portainer.OperationDockerNetworks
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/volume/volume.go#L25
func dockerVolumeOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("volumes", url)

	switch method {
	case http.MethodGet:
		// GET
		//router.NewGetRoute("/volumes", r.getVolumesList),
		//	router.NewGetRoute("/volumes/{name:.*}", r.getVolumeByName),
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationDockerVolumeList
			} else {
				return portainer.OperationDockerVolumeInspect
			}
		}
	case http.MethodPost:
		//router.NewPostRoute("/volumes/create", r.postVolumesCreate),
		//	router.NewPostRoute("/volumes/prune", r.postVolumesPrune),
		switch action {
		case "":
			if resource == "create" {
				return portainer.OperationDockerVolumeCreate
			} else if resource == "prune" {
				return portainer.OperationDockerVolumePrune
			}
		}
	case http.MethodDelete:
		// DELETE
		//router.NewDeleteRoute("/volumes/{name:.*}", r.deleteVolumes),
		if resource != "" && action == "" {
			return portainer.OperationDockerVolumeDelete
		}
	}

	return portainer.OperationDockerVolumes
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/container/container.go#L31
func dockerExecOperationAuthorization(url, method string) portainer.Authorization {
	_, action := extractResourceAndActionFromURL("exec", url)

	switch method {
	case http.MethodGet:
		// GET
		// 		router.NewGetRoute("/exec/{id:.*}/json", r.getExecByID),
		if action == "json" {
			return portainer.OperationDockerExecInspect
		}
	case http.MethodPost:
		// POST
		//router.NewPostRoute("/exec/{name:.*}/start", r.postContainerExecStart),
		//	router.NewPostRoute("/exec/{name:.*}/resize", r.postContainerExecResize),
		if action == "start" {
			return portainer.OperationDockerExecStart
		} else if action == "resize" {
			return portainer.OperationDockerExecResize
		}
	}

	return portainer.OperationDockerExec
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/swarm/cluster.go#L25
func dockerSwarmOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("swarm", url)

	switch method {
	case http.MethodGet:
		// GET
		//	router.NewGetRoute("/swarm", sr.inspectCluster),
		//	router.NewGetRoute("/swarm/unlockkey", sr.getUnlockKey),

		// TODO: example of potential Docker API evolution that we need to support
		// What if Docker adds GET /swarm/newfeature ?
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationDockerSwarmInspect
			} else {
				return portainer.OperationDockerSwarmUnlockKey
			}
		}
	case http.MethodPost:
		// POST
		//router.NewPostRoute("/swarm/init", sr.initCluster),
		//	router.NewPostRoute("/swarm/join", sr.joinCluster),
		//	router.NewPostRoute("/swarm/leave", sr.leaveCluster),
		//	router.NewPostRoute("/swarm/update", sr.updateCluster),
		//	router.NewPostRoute("/swarm/unlock", sr.unlockCluster),
		switch action {
		case "":
			switch resource {
			case "init":
				return portainer.OperationDockerSwarmInit
			case "join":
				return portainer.OperationDockerSwarmJoin
			case "leave":
				return portainer.OperationDockerSwarmLeave
			case "update":
				return portainer.OperationDockerSwarmUpdate
			case "unlock":
				return portainer.OperationDockerSwarmUnlock
			}
		}
	}

	return portainer.OperationDockerSwarm
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/swarm/cluster.go#L25
func dockerNodeOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("nodes", url)

	switch method {
	case http.MethodGet:
		// GET
		//router.NewGetRoute("/nodes", sr.getNodes),
		//	router.NewGetRoute("/nodes/{id}", sr.getNode),
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationDockerNodeList
			} else {
				return portainer.OperationDockerNodeInspect
			}
		}
	case http.MethodPost:
		// POST
		//	router.NewPostRoute("/nodes/{id}/update", sr.updateNode)
		if action == "update" {
			return portainer.OperationDockerNodeUpdate
		}
	case http.MethodDelete:
		// DELETE
		//	router.NewDeleteRoute("/nodes/{id}", sr.removeNode),
		if resource != "" {
			return portainer.OperationDockerNodeDelete
		}

	}

	return portainer.OperationDockerNodes
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/swarm/cluster.go#L25
func dockerServiceOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("services", url)

	switch method {
	case http.MethodGet:
		//// GET
		//router.NewGetRoute("/services", sr.getServices),
		//	router.NewGetRoute("/services/{id}", sr.getService),
		//	router.NewGetRoute("/services/{id}/logs", sr.getServiceLogs),
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationDockerServiceList
			} else {
				return portainer.OperationDockerServiceInspect
			}
		case "logs":
			return portainer.OperationDockerServiceLogs
		}
	case http.MethodPost:
		//// POST
		//	router.NewPostRoute("/services/create", sr.createService),
		//	router.NewPostRoute("/services/{id}/update", sr.updateService),
		switch action {
		case "":
			if resource == "create" {
				return portainer.OperationDockerServiceCreate
			}
		case "update":
			return portainer.OperationDockerServiceUpdate
		}
	case http.MethodDelete:
		//// DELETE
		//	router.NewDeleteRoute("/services/{id}", sr.removeService),
		if resource != "" && action == "" {
			return portainer.OperationDockerServiceDelete
		}
	}

	return portainer.OperationDockerServices
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/swarm/cluster.go#L25
func dockerSecretOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("secrets", url)

	switch method {
	case http.MethodGet:
		//// GET
		//router.NewGetRoute("/secrets", sr.getSecrets),
		//	router.NewGetRoute("/secrets/{id}", sr.getSecret),
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationDockerSecretList
			} else {
				return portainer.OperationDockerSecretInspect
			}
		}
	case http.MethodPost:
		//// POST
		//	router.NewPostRoute("/secrets/create", sr.createSecret),
		//	router.NewPostRoute("/secrets/{id}/update", sr.updateSecret),
		switch action {
		case "":
			if resource == "create" {
				return portainer.OperationDockerSecretCreate
			}
		case "update":
			return portainer.OperationDockerSecretUpdate
		}
	case http.MethodDelete:
		//// DELETE
		//	router.NewDeleteRoute("/secrets/{id}", sr.removeSecret),
		if resource != "" && action == "" {
			return portainer.OperationDockerSecretDelete
		}
	}

	return portainer.OperationDockerSecrets
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/swarm/cluster.go#L25
func dockerConfigOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("configs", url)

	switch method {
	case http.MethodGet:
		//// GET
		//router.NewGetRoute("/configs", sr.getConfigs),
		//	router.NewGetRoute("/configs/{id}", sr.getConfig),
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationDockerConfigList
			} else {
				return portainer.OperationDockerConfigInspect
			}
		}
	case http.MethodPost:
		//// POST
		//	router.NewPostRoute("/configs/create", sr.createConfig),
		//	router.NewPostRoute("/configs/{id}/update", sr.updateConfig),
		switch action {
		case "":
			if resource == "create" {
				return portainer.OperationDockerConfigCreate
			}
		case "update":
			return portainer.OperationDockerConfigUpdate
		}
	case http.MethodDelete:
		//// DELETE
		//	router.NewDeleteRoute("/configs/{id}", sr.removeConfig),
		if resource != "" && action == "" {
			return portainer.OperationDockerConfigDelete
		}
	}

	return portainer.OperationDockerConfigs
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/swarm/cluster.go#L25
func dockerTaskOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("tasks", url)

	switch method {
	case http.MethodGet:
		//// GET
		//router.NewGetRoute("/tasks", sr.getTasks),
		//	router.NewGetRoute("/tasks/{id}", sr.getTask),
		//	router.NewGetRoute("/tasks/{id}/logs", sr.getTaskLogs),
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationDockerTaskList
			} else {
				return portainer.OperationDockerTaskInspect
			}
		case "logs":
			return portainer.OperationDockerTaskLogs
		}
	}

	return portainer.OperationDockerTasks
}

// Based on the routes available at
//https://github.com/moby/moby/blob/c12f09bf99/api/server/router/plugin/plugin.go#L25
func dockerPluginOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("plugins", url)

	switch method {
	case http.MethodGet:
		//// GET
		//router.NewGetRoute("/plugins", r.listPlugins),
		//	router.NewGetRoute("/plugins/{name:.*}/json", r.inspectPlugin),
		//	router.NewGetRoute("/plugins/privileges", r.getPrivileges),
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationDockerPluginList
			} else if resource == "privileges" {
				return portainer.OperationDockerPluginPrivileges
			}
		case "json":
			return portainer.OperationDockerPluginInspect
		}
	case http.MethodPost:
		//// POST
		//	router.NewPostRoute("/plugins/pull", r.pullPlugin),
		//	router.NewPostRoute("/plugins/create", r.createPlugin),
		//	router.NewPostRoute("/plugins/{name:.*}/enable", r.enablePlugin),
		//	router.NewPostRoute("/plugins/{name:.*}/disable", r.disablePlugin),
		//	router.NewPostRoute("/plugins/{name:.*}/push", r.pushPlugin),
		//	router.NewPostRoute("/plugins/{name:.*}/upgrade", r.upgradePlugin),
		//	router.NewPostRoute("/plugins/{name:.*}/set", r.setPlugin),
		switch action {
		case "":
			if resource == "pull" {
				return portainer.OperationDockerPluginPull
			} else if resource == "create" {
				return portainer.OperationDockerPluginCreate
			}
		case "enable":
			return portainer.OperationDockerPluginEnable
		case "disable":
			return portainer.OperationDockerPluginDisable
		case "push":
			return portainer.OperationDockerPluginPush
		case "upgrade":
			return portainer.OperationDockerPluginUpgrade
		case "set":
			return portainer.OperationDockerPluginSet
		}
	case http.MethodDelete:
		//// DELETE
		//	router.NewDeleteRoute("/plugins/{name:.*}", r.removePlugin),
		if resource != "" && action == "" {
			return portainer.OperationDockerPluginDelete
		}
	}

	return portainer.OperationDockerPlugins
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/session/session.go
func dockerSessionOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("session", url)

	switch method {
	case http.MethodPost:
		//// POST
		//router.NewPostRoute("/session", r.startSession),
		if action == "" && resource == "" {
			return portainer.OperationDockerSessionStart
		}
	}

	return portainer.OperationDockerSessions
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/distribution/distribution.go#L26
func dockerDistributionOperationAuthorization(url, method string) portainer.Authorization {
	_, action := extractResourceAndActionFromURL("distribution", url)

	switch method {
	case http.MethodGet:
		//// GET
		//router.NewGetRoute("/distribution/{name:.*}/json", r.getDistributionInfo),
		if action == "json" {
			return portainer.OperationDockerDistributionInspect
		}
	}

	return portainer.OperationDockerDistributions
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/container/container.go#L31
func dockerCommitOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("commit", url)

	switch method {
	case http.MethodPost:
		//// POST
		// router.NewPostRoute("/commit", r.postCommit),
		if resource == "" && action == "" {
			return portainer.OperationDockerImageCommit
		}
	}

	return portainer.OperationDockerCommit
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/build/build.go#L32
func dockerBuildOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("build", url)

	switch method {
	case http.MethodPost:
		//// POST
		//	router.NewPostRoute("/build", r.postBuild),
		//	router.NewPostRoute("/build/prune", r.postPrune),
		//	router.NewPostRoute("/build/cancel", r.postCancel),
		switch action {
		case "":
			if resource == "" {
				return portainer.OperationDockerImageBuild
			} else if resource == "prune" {
				return portainer.OperationDockerBuildPrune
			} else if resource == "cancel" {
				return portainer.OperationDockerBuildCancel
			}
		}
	}

	return portainer.OperationDockerBuilds
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/image/image.go#L26
func dockerImageOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("images", url)

	switch method {
	case http.MethodGet:
		//// GET
		//router.NewGetRoute("/images/json", r.getImagesJSON),
		//	router.NewGetRoute("/images/search", r.getImagesSearch),
		//	router.NewGetRoute("/images/get", r.getImagesGet),
		//	router.NewGetRoute("/images/{name:.*}/get", r.getImagesGet),
		//	router.NewGetRoute("/images/{name:.*}/history", r.getImagesHistory),
		//	router.NewGetRoute("/images/{name:.*}/json", r.getImagesByName),
		switch action {
		case "":
			if resource == "json" {
				return portainer.OperationDockerImageList
			} else if resource == "search" {
				return portainer.OperationDockerImageSearch
			} else if resource == "get" {
				return portainer.OperationDockerImageGetAll
			}
		case "get":
			return portainer.OperationDockerImageGet
		case "history":
			return portainer.OperationDockerImageHistory
		case "json":
			return portainer.OperationDockerImageInspect
		}
	case http.MethodPost:
		//// POST
		//	router.NewPostRoute("/images/load", r.postImagesLoad),
		//	router.NewPostRoute("/images/create", r.postImagesCreate),
		//	router.NewPostRoute("/images/{name:.*}/push", r.postImagesPush),
		//	router.NewPostRoute("/images/{name:.*}/tag", r.postImagesTag),
		//	router.NewPostRoute("/images/prune", r.postImagesPrune),
		switch action {
		case "":
			if resource == "load" {
				return portainer.OperationDockerImageLoad
			} else if resource == "create" {
				return portainer.OperationDockerImageCreate
			} else if resource == "prune" {
				return portainer.OperationDockerImagePrune
			}
		case "push":
			return portainer.OperationDockerImagePush
		case "tag":
			return portainer.OperationDockerImageTag
		}
	case http.MethodDelete:
		//// DELETE
		//	router.NewDeleteRoute("/images/{name:.*}", r.deleteImages)
		if resource != "" && action == "" {
			return portainer.OperationDockerImageDelete
		}
	}

	return portainer.OperationDockerImages
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/container/container.go#L31
func dockerContainerOperationAuthorization(url, method string) portainer.Authorization {
	resource, action := extractResourceAndActionFromURL("containers", url)

	switch method {
	case http.MethodHead:
		//// HEAD
		//router.NewHeadRoute("/containers/{name:.*}/archive", r.headContainersArchive),
		if action == "archive" {
			return portainer.OperationDockerContainerArchiveInfo
		}
	case http.MethodGet:
		//// GET
		//	router.NewGetRoute("/containers/json", r.getContainersJSON),
		//	router.NewGetRoute("/containers/{name:.*}/export", r.getContainersExport),
		//	router.NewGetRoute("/containers/{name:.*}/changes", r.getContainersChanges),
		//	router.NewGetRoute("/containers/{name:.*}/json", r.getContainersByName),
		//	router.NewGetRoute("/containers/{name:.*}/top", r.getContainersTop),
		//	router.NewGetRoute("/containers/{name:.*}/logs", r.getContainersLogs),
		//	router.NewGetRoute("/containers/{name:.*}/stats", r.getContainersStats),
		//	router.NewGetRoute("/containers/{name:.*}/attach/ws", r.wsContainersAttach),
		//	router.NewGetRoute("/exec/{id:.*}/json", r.getExecByID),
		//	router.NewGetRoute("/containers/{name:.*}/archive", r.getContainersArchive),
		switch action {
		case "":
			if resource == "json" {
				return portainer.OperationDockerContainerList
			}
		case "export":
			return portainer.OperationDockerContainerExport
		case "changes":
			return portainer.OperationDockerContainerChanges
		case "json":
			return portainer.OperationDockerContainerInspect
		case "top":
			return portainer.OperationDockerContainerTop
		case "logs":
			return portainer.OperationDockerContainerLogs
		case "stats":
			return portainer.OperationDockerContainerStats
		case "attach/ws":
			return portainer.OperationDockerContainerAttachWebsocket
		case "archive":
			return portainer.OperationDockerContainerArchive
		}
	case http.MethodPost:
		//// POST
		//	router.NewPostRoute("/containers/create", r.postContainersCreate),
		//	router.NewPostRoute("/containers/{name:.*}/kill", r.postContainersKill),
		//	router.NewPostRoute("/containers/{name:.*}/pause", r.postContainersPause),
		//	router.NewPostRoute("/containers/{name:.*}/unpause", r.postContainersUnpause),
		//	router.NewPostRoute("/containers/{name:.*}/restart", r.postContainersRestart),
		//	router.NewPostRoute("/containers/{name:.*}/start", r.postContainersStart),
		//	router.NewPostRoute("/containers/{name:.*}/stop", r.postContainersStop),
		//	router.NewPostRoute("/containers/{name:.*}/wait", r.postContainersWait),
		//	router.NewPostRoute("/containers/{name:.*}/resize", r.postContainersResize),
		//	router.NewPostRoute("/containers/{name:.*}/attach", r.postContainersAttach),
		//	router.NewPostRoute("/containers/{name:.*}/copy", r.postContainersCopy), // Deprecated since 1.8, Errors out since 1.12
		//	router.NewPostRoute("/containers/{name:.*}/exec", r.postContainerExecCreate),
		//	router.NewPostRoute("/exec/{name:.*}/start", r.postContainerExecStart),
		//	router.NewPostRoute("/exec/{name:.*}/resize", r.postContainerExecResize),
		//	router.NewPostRoute("/containers/{name:.*}/rename", r.postContainerRename),
		//	router.NewPostRoute("/containers/{name:.*}/update", r.postContainerUpdate),
		//	router.NewPostRoute("/containers/prune", r.postContainersPrune),
		//	router.NewPostRoute("/commit", r.postCommit),
		switch action {
		case "":
			if resource == "create" {
				return portainer.OperationDockerContainerCreate
			} else if resource == "prune" {
				return portainer.OperationDockerContainerPrune
			}
		case "kill":
			return portainer.OperationDockerContainerKill
		case "pause":
			return portainer.OperationDockerContainerPause
		case "unpause":
			return portainer.OperationDockerContainerUnpause
		case "restart":
			return portainer.OperationDockerContainerRestart
		case "start":
			return portainer.OperationDockerContainerStart
		case "stop":
			return portainer.OperationDockerContainerStop
		case "wait":
			return portainer.OperationDockerContainerWait
		case "resize":
			return portainer.OperationDockerContainerResize
		case "attach":
			return portainer.OperationDockerContainerAttach
		case "exec":
			return portainer.OperationDockerContainerExec
		case "rename":
			return portainer.OperationDockerContainerRename
		case "update":
			return portainer.OperationDockerContainerUpdate
		}
	case http.MethodPut:
		//// PUT
		//	router.NewPutRoute("/containers/{name:.*}/archive", r.putContainersArchive),
		if action == "archive" {
			return portainer.OperationDockerContainerPutContainerArchive
		}
	case http.MethodDelete:
		//// DELETE
		//	router.NewDeleteRoute("/containers/{name:.*}", r.deleteContainers),
		if resource != "" && action == "" {
			return portainer.OperationDockerContainerDelete
		}
	}

	// TODO: default generic resource operation?
	return portainer.OperationDockerContainers
}
