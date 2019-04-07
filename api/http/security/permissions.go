package security

import (
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/portainer/portainer/api"
)

type OperationDomain int

const (
	_ OperationDomain = iota
	DockerContainerOperation
	DockerImageOperation
	DockerOperation
	PortainerOperation
)

var dockerRule = regexp.MustCompile(`/(?P<identifier>\d+)/docker(?P<operation>/.*)`)
var registryRule = regexp.MustCompile(`/registries/(?P<identifier>\d+)/v2(?P<operation>/.*)?`)

func checkPermissions(r *http.Request) error {
	tokenData, err := RetrieveTokenData(r)
	if err != nil {
		return err
	}

	authorized := authorizedOperation(r, &tokenData.Authorizations)
	if !authorized {
		return portainer.ErrAuthorizationRequired
	}

	return nil
}

func authorizedOperation(r *http.Request, authorizations *portainer.AuthorizationSet) bool {
	log.Printf("RBAC | Permission check for %s - %s", r.Method, r.URL.String())
	operationPermission, domain := getOperationPermission(r.URL.String(), r.Method)
	return roleAuthorized(operationPermission, domain, authorizations)
}

func roleAuthorized(operationPermission portainer.UserPermissionSet, operationDomain OperationDomain, authorizations *portainer.AuthorizationSet) bool {

	//return authorizations[operationPermission]

	switch operationDomain {
	//case DockerOperation:
	//	return operationPermission&authorizations.DockerContainerPermissions != 0
	case DockerContainerOperation:
		return operationPermission&authorizations.DockerContainerPermissions != 0
	case DockerImageOperation:
		return operationPermission&authorizations.DockerImagePermissions != 0
	case PortainerOperation:
		return operationPermission&authorizations.PortainerAuthorizationSetPermissions != 0
	}

	return false
}

func getOperationPermission(url, method string) (portainer.UserPermissionSet, OperationDomain) {
	if dockerRule.MatchString(url) {
		match := dockerRule.FindStringSubmatch(url)
		return getDockerOperationPermission(strings.TrimPrefix(url, "/"+match[1]+"/docker"), method)
	} else if registryRule.MatchString(url) {
		return portainer.PortainerAdmin, PortainerOperation
	} else {
		return getPortainerOperationPermission(url, method)
	}
}

func getPortainerOperationPermission(url, method string) (portainer.UserPermissionSet, OperationDomain) {
	fmt.Printf("Portainer operation: %s,%s\n", method, url)

	urlParts := strings.Split(url, "/")
	baseResource := urlParts[1]

	// TODO: review default permission
	domain := PortainerOperation
	permission := portainer.PortainerAdmin

	switch baseResource {
	case "authorization_sets":
		permission = portainerAuthorizationSetOperationPermission(url, method)
	}

	return permission, domain
}

func getDockerOperationPermission(url, method string) (portainer.UserPermissionSet, OperationDomain) {
	urlParts := strings.Split(url, "/")
	baseResource := urlParts[1]

	// TODO: review default permission
	domain := PortainerOperation
	permission := portainer.PortainerAdmin

	switch baseResource {
	case "containers":
		permission = dockerContainerOperationPermission(url, method)
		domain = DockerContainerOperation
	case "images":
		permission = dockerImageOperationPermission(url, method)
		domain = DockerImageOperation
	case "networks":
		permission = portainer.DockerNetworks
		domain = DockerOperation
	case "volumes":
		permission = portainer.DockerVolumes
		domain = DockerOperation
	case "exec":
		permission = portainer.DockerExec
		domain = DockerOperation
	case "swarm":
		permission = portainer.DockerSwarm
		domain = DockerOperation
	case "nodes":
		permission = portainer.DockerNodes
		domain = DockerOperation
	case "services":
		permission = portainer.DockerServices
		domain = DockerOperation
	case "secrets":
		permission = portainer.DockerSecrets
		domain = DockerOperation
	case "configs":
		permission = portainer.DockerConfigs
		domain = DockerOperation
	case "tasks":
		permission = portainer.DockerTasks
		domain = DockerOperation
	case "plugins":
		permission = portainer.DockerPlugins
		domain = DockerOperation
	case "info":
		permission = portainer.DockerInfo
		domain = DockerOperation
	case "_ping":
		permission = portainer.DockerPing
		domain = DockerOperation
	case "version":
		permission = portainer.DockerVersion
		domain = DockerOperation
	case "events":
		permission = portainer.DockerEvents
		domain = DockerOperation
	case "system/df":
		permission = portainer.DockerSystem
		domain = DockerOperation
	case "session":
		permission = portainer.DockerSessions
		domain = DockerOperation
	case "distribution":
		permission = portainer.DockerDistributions
		domain = DockerOperation
	case "commit":
		permission = portainer.DockerCommit
		domain = DockerOperation
	case "build":
		permission = portainer.DockerBuilds
		domain = DockerOperation
	}

	fmt.Printf("Docker operation: %s | Base: %s\n", url, baseResource)

	return permission, domain
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

func portainerAuthorizationSetOperationPermission(url, method string) portainer.UserPermissionSet {
	routeResource := "authorization_sets"
	routePattern := regexp.MustCompile(`/` + routeResource + `/(?P<resource>[^/]*)/?(?P<action>.*)?`)
	lastMatch := findNamedMatches(routePattern, url)
	fmt.Printf("AUTHORIZATIONSETS OPERATION: %s,%s | resource: %s | action: %s\n", method, url, lastMatch["resource"], lastMatch["action"])
	resource := lastMatch["resource"]
	action := lastMatch["action"]

	switch method {
	case http.MethodGet:
		if resource == "" && action == "" {
			return portainer.PortainerAuthorizationSetList
		} else if resource != "" && action == "" {
			return portainer.PortainerAuthorizationSetInspect
		}
	}

	return portainer.PortainerAdmin
}

// Based on the routes available at
// https://github.com/moby/moby/blob/c12f09bf99b54f274a5ae241dd154fa74020cbab/api/server/router/container/container.go#L31
func dockerContainerOperationPermission(url, method string) portainer.UserPermissionSet {

	// TODO: refactor/centralize
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
			return portainer.DockerContainerArchiveInfo
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
				return portainer.DockerContainerList
			}
		case "export":
			return portainer.DockerContainerExport
		case "changes":
			return portainer.DockerContainerChanges
		case "json":
			return portainer.DockerContainerInspect
		case "top":
			return portainer.DockerContainerTop
		case "logs":
			return portainer.DockerContainerLogs
		case "stats":
			return portainer.DockerContainerStats
		case "attach/ws":
			return portainer.DockerContainerAttachWebsocket
		case "archive":
			return portainer.DockerContainerArchive
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
				return portainer.DockerContainerCreate
			} else if resource == "prune" {
				return portainer.DockerContainerPrune
			}
		case "kill":
			return portainer.DockerContainerKill
		case "pause":
			return portainer.DockerContainerPause
		case "unpause":
			return portainer.DockerContainerUnpause
		case "restart":
			return portainer.DockerContainerRestart
		case "start":
			return portainer.DockerContainerStart
		case "stop":
			return portainer.DockerContainerStop
		case "wait":
			return portainer.DockerContainerWait
		case "resize":
			return portainer.DockerContainerResize
		case "attach":
			return portainer.DockerContainerAttach
		case "exec":
			return portainer.DockerContainerExec
		case "rename":
			return portainer.DockerContainerRename
		case "update":
			return portainer.DockerContainerUpdate
		}
	case http.MethodPut:
		//// PUT
		//	router.NewPutRoute("/containers/{name:.*}/archive", r.putContainersArchive),
		if action == "archive" {
			return portainer.DockerContainerPutContainerArchive
		}
	case http.MethodDelete:
		//// DELETE
		//	router.NewDeleteRoute("/containers/{name:.*}", r.deleteContainers),
		if resource != "" && action == "" {
			return portainer.DockerContainerDelete
		}
	}

	// TODO: default value?
	return portainer.PortainerAdmin
}

func dockerImageOperationPermission(url, method string) portainer.UserPermissionSet {
	// TODO: centralize
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
				return portainer.DockerImageList
			} else if resource == "search" {
				return portainer.DockerImageSearch
			} else if resource == "get" {
				return portainer.DockerImageGetAll
			}
		case "get":
			return portainer.DockerImageGet
		case "history":
			return portainer.DockerImageHistory
		case "json":
			return portainer.DockerImageInspect
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
				return portainer.DockerImageLoad
			} else if resource == "create" {
				return portainer.DockerImageCreate
			} else if resource == "prune" {
				return portainer.DockerImagePrune
			}
		case "push":
		case "tag":
		}
	case http.MethodDelete:
		//// DELETE
		//	router.NewDeleteRoute("/images/{name:.*}", r.deleteImages)
		if resource != "" && action == "" {
			return portainer.DockerImageDelete
		}
	}

	// TODO: default value?
	return portainer.PortainerAdmin
}
