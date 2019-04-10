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

	permission := portainer.OperationPortainerAdmin

	switch baseResource {
	case "roles":
		permission = portainerRoleOperationAuthorization(url, method)
	}

	return permission
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
		return portainer.OperationDockerNetworks
	case "volumes":
		return portainer.OperationDockerVolumes
	case "exec":
		return portainer.OperationDockerExec
	case "swarm":
		return portainer.OperationDockerSwarm
	case "nodes":
		return portainer.OperationDockerNodes
	case "services":
		return portainer.OperationDockerServices
	case "secrets":
		return portainer.OperationDockerSecrets
	case "configs":
		return portainer.OperationDockerConfigs
	case "tasks":
		return portainer.OperationDockerTasks
	case "plugins":
		return portainer.OperationDockerPlugins
	case "info":
		return portainer.OperationDockerInfo
	case "_ping":
		return portainer.OperationDockerPing
	case "version":
		return portainer.OperationDockerVersion
	case "events":
		return portainer.OperationDockerEvents
	case "system/df":
		return portainer.OperationDockerSystem
	case "session":
		return portainer.OperationDockerSessions
	case "distribution":
		return portainer.OperationDockerDistributions
	case "commit":
		return portainer.OperationDockerCommit
	case "build":
		return portainer.OperationDockerBuilds
	default:
		// TODO: review default
		return portainer.OperationPortainerAdmin
	}
}

// TODO: rename
func findNamedMatches(regex *regexp.Regexp, str string) map[string]string {
	match := regex.FindStringSubmatch(str)

	results := map[string]string{}
	for i, name := range match {
		results[regex.SubexpNames()[i]] = name
	}
	return results
}

func portainerRoleOperationAuthorization(url, method string) portainer.Authorization {
	routeResource := "roles"
	routePattern := regexp.MustCompile(`/` + routeResource + `/(?P<resource>[^/]*)/?(?P<action>.*)?`)
	lastMatch := findNamedMatches(routePattern, url)
	fmt.Printf("PORTAINER ROLES OPERATION: %s,%s | resource: %s | action: %s\n", method, url, lastMatch["resource"], lastMatch["action"])
	resource := lastMatch["resource"]
	action := lastMatch["action"]

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.OperationPortainerRoleList
		} else if resource != "" && action == "" {
			return portainer.OperationPortainerRoleInspect
		}
	}

	return portainer.OperationPortainerAdmin
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99/api/server/router/image/image.go#L26
func dockerImageOperationAuthorization(url, method string) portainer.Authorization {
	routeResource := "images"
	routePattern := regexp.MustCompile(`/` + routeResource + `/(?P<resource>[^/]*)/?(?P<action>.*)?`)
	lastMatch := findNamedMatches(routePattern, url)
	fmt.Printf("IMAGE OPERATION: %s,%s | resource: %s | action: %s\n", method, url, lastMatch["resource"], lastMatch["action"])
	resource := lastMatch["resource"]
	action := lastMatch["action"]

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
		case "tag":
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
	routeResource := "containers"
	routePattern := regexp.MustCompile(`/` + routeResource + `/(?P<resource>[^/]*)/?(?P<action>.*)?`)
	lastMatch := findNamedMatches(routePattern, url)
	fmt.Printf("CONTAINER OPERATION: %s,%s | resource: %s | action: %s\n", method, url, lastMatch["resource"], lastMatch["action"])
	resource := lastMatch["resource"]
	action := lastMatch["action"]

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
