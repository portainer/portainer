package main

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"
)

//type Permission int
//type OperationDomain int

type Authorization string
type Role map[Authorization]bool

//type UserRole struct {
//	DockerContainerPermissions Permission
//	DockerImagePermissions     Permission
//}

type User struct {
	ID             int    `json:"ID"`
	Username       string `json:"Username"`
	Authorizations Role   `json:"Authorizations"`
}

//const (
//	_ OperationDomain = iota
//	DockerContainerOperation
//	DockerImageOperation
//	DockerOperation
//	PortainerOperation
//)

const (
	// TODO: if we keep these ones, should it have a particular value?
	OperationDockerContainers Authorization = "DockerContainer"
	OperationDockerImages     Authorization = "DockerImages"

	OperationDockerContainerArchiveInfo         Authorization = "DockerContainerArchiveInfo"
	OperationDockerContainerList                Authorization = "DockerContainerList"
	OperationDockerContainerExport              Authorization = "DockerContainerExport "
	OperationDockerContainerChanges             Authorization = "DockerContainerChanges"
	OperationDockerContainerInspect             Authorization = "DockerContainerInspect"
	OperationDockerContainerTop                 Authorization = "DockerContainerTop"
	OperationDockerContainerLogs                Authorization = "DockerContainerLogs"
	OperationDockerContainerStats               Authorization = "DockerContainerStats"
	OperationDockerContainerAttachWebsocket     Authorization = "DockerContainerAttachWebsocket"
	OperationDockerContainerArchive             Authorization = "DockerContainerArchive"
	OperationDockerContainerCreate              Authorization = "DockerContainerCreate"
	OperationDockerContainerPrune               Authorization = "DockerContainerPrune"
	OperationDockerContainerKill                Authorization = "DockerContainerKill"
	OperationDockerContainerPause               Authorization = "DockerContainerPause"
	OperationDockerContainerUnpause             Authorization = "DockerContainerUnpause"
	OperationDockerContainerRestart             Authorization = "DockerContainerRestart"
	OperationDockerContainerStart               Authorization = "DockerContainerStart"
	OperationDockerContainerStop                Authorization = "DockerContainerStop"
	OperationDockerContainerWait                Authorization = "DockerContainerWait"
	OperationDockerContainerResize              Authorization = "DockerContainerResize"
	OperationDockerContainerAttach              Authorization = "DockerContainerAttach"
	OperationDockerContainerExec                Authorization = "DockerContainerExec"
	OperationDockerContainerRename              Authorization = "DockerContainerRename"
	OperationDockerContainerUpdate              Authorization = "DockerContainerUpdate"
	OperationDockerContainerPutContainerArchive Authorization = "DockerContainerPutContainerArchive "
	OperationDockerContainerDelete              Authorization = "DockerContainerDelete"
	OperationDockerImageList                    Authorization = "DockerImageList "
	OperationDockerImageSearch                  Authorization = "DockerImageSearch "
	OperationDockerImageGetAll                  Authorization = "DockerImageGetAll"
	OperationDockerImageGet                     Authorization = "DockerImageGet"
	OperationDockerImageHistory                 Authorization = "DockerImageHistory"
	OperationDockerImageInspect                 Authorization = "DockerImageInspect"
	OperationDockerImageLoad                    Authorization = "DockerImageLoad"
	OperationDockerImageCreate                  Authorization = "DockerImageCreate"
	OperationDockerImagePrune                   Authorization = "DockerImagePrune"
	OperationDockerImageDelete                  Authorization = "DockerImageDelete"
	OperationPortainerDockerHubInspect          Authorization = "PortainerDockerHubInspect"
	OperationPortainerDockerHubUpdate           Authorization = "PortainerDockerHubUpdate"
	OperationPortainerEndpointGroupCreate       Authorization = "PortainerEndpointGroupCreate"
	OperationPortainerEndpointGroupList         Authorization = "PortainerEndpointGroupList"
	OperationPortainerEndpointGroupDelete       Authorization = "PortainerEndpointGroupDelete"
	OperationPortainerEndpointGroupInspect      Authorization = "PortainerEndpointGroupInspect"
	OperationPortainerEndpointGroupEdit         Authorization = "PortainerEndpointGroupEdit"
	OperationPortainerEndpointGroupAccess       Authorization = "PortainerEndpointGroupAccess "
	OperationPortainerEndpointList              Authorization = "PortainerEndpointList"
	OperationPortainerEndpointCreate            Authorization = "PortainerEndpointCreate"
	OperationPortainerEndpointExtensionDelete   Authorization = "PortainerEndpointExtensionDelete"
	OperationPortainerExtensionList             Authorization = "PortainerExtensionList"
	OperationPortainerStackList                 Authorization = "PortainerStackList"
	OperationPortainerMOTD                      Authorization = "PortainerMOTD"
	OperationDockerInfo                         Authorization = "DockerInfo"
	OperationDockerVersion                      Authorization = "DockerVersion"
	OperationDockerNetworks                     Authorization = "DockerNetworks"
	OperationDockerVolumes                      Authorization = "DockerVolumes"
	OperationDockerExec                         Authorization = "DockerExec"
	OperationDockerSwarm                        Authorization = "DockerSwarm"
	OperationDockerNodes                        Authorization = "DockerNodes"
	OperationDockerServices                     Authorization = "DockerServices"
	OperationDockerSecrets                      Authorization = "DockerSecrets"
	OperationDockerConfigs                      Authorization = "DockerConfigs"
	OperationDockerTasks                        Authorization = "DockerTasks"
	OperationDockerPlugins                      Authorization = "DockerPlugins"
	OperationDockerPing                         Authorization = "DockerPing"
	OperationDockerEvents                       Authorization = "DockerEvents"
	OperationDockerSessions                     Authorization = "DockerSessions"
	OperationDockerDistributions                Authorization = "DockerDistributions"
	OperationDockerCommit                       Authorization = "DockerCommit"
	OperationDockerBuilds                       Authorization = "DockerBuilds"
	OperationDockerSystem                       Authorization = "DockerSystem"
	OperationPortainerAdmin                     Authorization = "PortainerAdmin"
)

//const (
//	_ Permission = 1 << iota
//	DockerContainerArchiveInfo
//	DockerContainerList
//	DockerContainerExport
//	DockerContainerChanges
//	DockerContainerInspect
//	DockerContainerTop
//	DockerContainerLogs
//	DockerContainerStats
//	DockerContainerAttachWebsocket
//	DockerContainerArchive
//	DockerContainerCreate
//	DockerContainerPrune
//	DockerContainerKill
//	DockerContainerPause
//	DockerContainerUnpause
//	DockerContainerRestart
//	DockerContainerStart
//	DockerContainerStop
//	DockerContainerWait
//	DockerContainerResize
//	DockerContainerAttach
//	DockerContainerExec
//	DockerContainerRename
//	DockerContainerUpdate
//	DockerContainerPutContainerArchive
//	DockerContainerDelete
//
//	_ Permission = 1 << iota
//	DockerImageList
//	DockerImageSearch
//	DockerImageGetAll
//	DockerImageGet
//	DockerImageHistory
//	DockerImageInspect
//	DockerImageLoad
//	DockerImageCreate
//	DockerImagePrune
//	DockerImageDelete
//
//	_ Permission = 1 << iota
//	PortainerDockerHubInspect
//	PortainerDockerHubUpdate
//
//	_ Permission = 1 << iota
//	PortainerEndpointGroupCreate
//	PortainerEndpointGroupList
//	PortainerEndpointGroupDelete
//	PortainerEndpointGroupInspect
//	PortainerEndpointGroupEdit
//	PortainerEndpointGroupAccess
//
//	_ Permission = 1 << iota
//	PortainerEndpointList
//	PortainerEndpointCreate
//	PortainerEndpointExtensionDelete
//
//	_ Permission = 1 << iota
//	PortainerExtensionList
//
//	_ Permission = 1 << iota
//	PortainerStackList
//
//	_ Permission = 1 << iota
//	PortainerMOTD
//
//	_ Permission = 1 << iota
//	DockerInfo
//	DockerVersion
//	DockerNetworks
//	DockerVolumes
//	DockerExec
//	DockerSwarm
//	DockerNodes
//	DockerServices
//	DockerSecrets
//	DockerConfigs
//	DockerTasks
//	DockerPlugins
//	DockerPing
//	DockerEvents
//	DockerSessions
//	DockerDistributions
//	DockerCommit
//	DockerBuilds
//	DockerSystem
//
//	// TODO: review this? Do we need to keep it?
//	_ Permission = 1 << iota
//	PortainerAdmin
//)

//func roleAuthorized(operationPermission Permission, operationDomain OperationDomain, role *UserRole) bool {
//	switch operationDomain {
//	case DockerOperation:
//		return operationPermission&role.DockerContainerPermissions != 0
//	case DockerContainerOperation:
//		return operationPermission&role.DockerContainerPermissions != 0
//	case DockerImageOperation:
//		return operationPermission&role.DockerImagePermissions != 0
//	case PortainerOperation:
//		return operationPermission&role.DockerContainerPermissions != 0
//	}
//
//	return false
//}

func UserAuthorizationCheck(url, method string, user *User) {
	requiredAuthorization := getOperationAuthorization(url, method)
	if user.Authorizations[requiredAuthorization] {
		fmt.Println("Authorized. GG")
	} else {
		fmt.Println("Unauthorized. RIP")
	}
}

func getOperationAuthorization(url, method string) Authorization {

	if dockerRule.MatchString(url) {
		match := dockerRule.FindStringSubmatch(url)
		return getDockerOperationAuthorization(strings.TrimPrefix(url, "/"+match[1]+"/docker"), method)
	} else if registryRule.MatchString(url) {
		//match := registryRule.FindStringSubmatch(url)
		//context = "registry"
		//contextDetails = match[1]
		return getRegistryOperationAuthorization(url, method)
	}

	return OperationPortainerAdmin
	//uri, err := url.Parse(reqURL)
	//if err != nil {
	//	fmt.Println(err)
	//}

	//fmt.Printf("Base: %s\n", path.Base(reqURL))
	//fmt.Printf("Dir: %s\n", path.Dir(reqURL))
	//match := operationRule.FindStringSubmatch(url)
	//fmt.Printf("Match: %+v", match)

	//return PortainerAdmin, PortainerOperation
}

//func permCheck(url, method string, role *UserRole) {
//	requiredPerm, domain := convertURLtoOperation(url, method)
//
//	authorized := roleAuthorized(requiredPerm, domain, role)
//	if authorized {
//		fmt.Println("Authorized")
//	} else {
//		fmt.Println("Unauthorized")
//	}
//}

func main() {
	//fmt.Printf("System: %v\n", DockerSystem)
	//fmt.Printf("Container: %v\n", DockerContainer)
	//fmt.Printf("ContainerList: %v\n", DockerContainerList)
	//fmt.Printf("Image: %v\n", DockerImage)
	//fmt.Printf("Docker: %v\n", Docker)
	//fmt.Printf("Custom2: %v\n", Custom1)
	//fmt.Printf("Custom2: %v\n", Custom2)

	u1 := User{
		ID:       1,
		Username: "admin",
		Authorizations: Role{
			OperationDockerContainerList:   true,
			OperationDockerContainerCreate: true,
			OperationDockerImageList:       true,
		},
	}

	UserAuthorizationCheck("/1/docker/containers/json", http.MethodGet, &u1)
	UserAuthorizationCheck("/1/docker/containers/plop/start", http.MethodPost, &u1)
	UserAuthorizationCheck("/1/docker/networks/json", http.MethodGet, &u1)

	//userRole1 := UserRole{
	//	DockerContainerPermissions: DockerContainerList | DockerContainerCreate,
	//	DockerImagePermissions:     DockerImageList,
	//}

	//permCheck("/1/docker/containers/json", http.MethodGet, &userRole1)
	//permCheck("/1/docker/containers/plop/start", http.MethodPost, &userRole1)
	//permCheck("/1/docker/networks/json", http.MethodGet, &userRole1)

	//userRole2 := Portainer
	//userRole3 := GlobalAdmin

	// /teams POST
	// /teams GET
	// /teams/{id} GET
	// /teams/{id} PUT
	// /teams/{id} DELETE
	// /teams/{id}/memberships GET

	//convertURLtoOperation("/teams", "POST")
	//convertURLtoOperation("/teams", "GET")
	//convertURLtoOperation("/teams/1", "GET")
	//convertURLtoOperation("/teams/1", "PUT")
	//convertURLtoOperation("/teams/1", "DELETE")
	//convertURLtoOperation("/teams/1/memberships", "GET")

	//containerId := "69cc1f3e9c3c"
	//containerOperationBaseURL := "/1/docker/containers"

	// TODO: consider this in unit tests

	//// HEAD
	//router.NewHeadRoute("/containers/{name:.*}/archive", r.headContainersArchive),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "archive"), http.MethodHead)
	////// GET
	////	router.NewGetRoute("/containers/json", r.getContainersJSON),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, "json"), http.MethodGet)
	////	router.NewGetRoute("/containers/{name:.*}/export", r.getContainersExport),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "export"), http.MethodGet)
	////	router.NewGetRoute("/containers/{name:.*}/changes", r.getContainersChanges),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "changes"), http.MethodGet)
	////	router.NewGetRoute("/containers/{name:.*}/json", r.getContainersByName),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "json"), http.MethodGet)
	////	router.NewGetRoute("/containers/{name:.*}/top", r.getContainersTop),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "top"), http.MethodGet)
	////	router.NewGetRoute("/containers/{name:.*}/logs", r.getContainersLogs),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "logs"), http.MethodGet)
	////	router.NewGetRoute("/containers/{name:.*}/stats", r.getContainersStats),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "stats"), http.MethodGet)
	////	router.NewGetRoute("/containers/{name:.*}/attach/ws", r.wsContainersAttach),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "attach", "ws"), http.MethodGet)
	////	router.NewGetRoute("/exec/{id:.*}/json", r.getExecByID),
	//// TODO: must be added in /exec
	////	router.NewGetRoute("/containers/{name:.*}/archive", r.getContainersArchive),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "archive"), http.MethodGet)
	////// POST
	////	router.NewPostRoute("/containers/create", r.postContainersCreate),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, "create"), http.MethodPost)
	////	router.NewPostRoute("/containers/{name:.*}/kill", r.postContainersKill),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "kill"), http.MethodPost)
	////	router.NewPostRoute("/containers/{name:.*}/pause", r.postContainersPause),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "pause"), http.MethodPost)
	////	router.NewPostRoute("/containers/{name:.*}/unpause", r.postContainersUnpause),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "unpause"), http.MethodPost)
	////	router.NewPostRoute("/containers/{name:.*}/restart", r.postContainersRestart),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "restart"), http.MethodPost)
	////	router.NewPostRoute("/containers/{name:.*}/start", r.postContainersStart),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "start"), http.MethodPost)
	////	router.NewPostRoute("/containers/{name:.*}/stop", r.postContainersStop),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "stop"), http.MethodPost)
	////	router.NewPostRoute("/containers/{name:.*}/wait", r.postContainersWait),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "wait"), http.MethodPost)
	////	router.NewPostRoute("/containers/{name:.*}/resize", r.postContainersResize),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "resize"), http.MethodPost)
	////	router.NewPostRoute("/containers/{name:.*}/attach", r.postContainersAttach),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "attach"), http.MethodPost)
	////	router.NewPostRoute("/containers/{name:.*}/copy", r.postContainersCopy), // Deprecated since 1.8, Errors out since 1.12
	////	router.NewPostRoute("/containers/{name:.*}/exec", r.postContainerExecCreate),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "exec"), http.MethodPost)
	////	router.NewPostRoute("/exec/{name:.*}/start", r.postContainerExecStart),
	//// TODO: must be added in /exec
	////	router.NewPostRoute("/exec/{name:.*}/resize", r.postContainerExecResize),
	//// TODO: must be added in /exec
	////	router.NewPostRoute("/containers/{name:.*}/rename", r.postContainerRename),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "rename"), http.MethodPost)
	////	router.NewPostRoute("/containers/{name:.*}/update", r.postContainerUpdate),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "update"), http.MethodPost)
	////	router.NewPostRoute("/containers/prune", r.postContainersPrune),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, "prune"), http.MethodPost)
	////	router.NewPostRoute("/commit", r.postCommit),
	//// TODO: must have its own route check
	////// PUT
	////	router.NewPutRoute("/containers/{name:.*}/archive", r.putContainersArchive),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId, "archive"), http.MethodPut)
	////// DELETE
	////	router.NewDeleteRoute("/containers/{name:.*}", r.deleteContainers),
	//convertURLtoOperation(path.Join(containerOperationBaseURL, containerId), http.MethodDelete)
	//
	//convertURLtoOperation("/1/docker/nodes", "GET")
	//convertURLtoOperation("/1/docker/nodes/jkkj18231", "GET")
	//
	//convertURLtoOperation("/registries/1", "GET")
	//convertURLtoOperation("/registries/1/configure", "PUT")
	//convertURLtoOperation("/registries/1/v2", "GET")
	//convertURLtoOperation("/registries/1/v2/_catalog", "GET")
	//convertURLtoOperation("/registries/1/v2/jksjduqwe/tags/list", "GET")
	//convertURLtoOperation("/registries/1/v2/jsdfoqwu23e/blobs/182938123", "DELETE")

	//permCheck("/endpoints", "POST", userRole1)
	//permCheck("/endpoints", "POST", userRole2)
	//permCheck("/1/docker/_ping", "POST", userRole2)
	//permCheck("/endpoints/unknown", "POST", userRole3)
	//permCheck("/1/docker/containers/json", "GET", userRole3)
}

var dockerRule = regexp.MustCompile(`/(?P<identifier>\d+)/docker(?P<operation>/.*)`)
var registryRule = regexp.MustCompile(`/registries/(?P<identifier>\d+)/v2(?P<operation>/.*)?`)

//var apiOperationRule = regexp.MustCompile(`(?P<resource>\w+)/?(?P<subresource>.*)?`)

func findNamedMatches(regex *regexp.Regexp, str string) map[string]string {
	match := regex.FindStringSubmatch(str)

	results := map[string]string{}
	for i, name := range match {
		results[regex.SubexpNames()[i]] = name
	}
	return results
}

func getRegistryOperationAuthorization(url, method string) Authorization {
	return OperationPortainerAdmin
}

func getDockerOperationAuthorization(url, method string) Authorization {
	urlParts := strings.Split(url, "/")
	baseResource := urlParts[1]

	switch baseResource {
	case "containers":
		return dockerContainerOperationAuthorization(url, method)
	case "images":
		return dockerImageOperationAuthorization(url, method)
	case "networks":
		return OperationDockerNetworks
	case "volumes":
		return OperationDockerVolumes
	case "exec":
		return OperationDockerExec
	case "swarm":
		return OperationDockerSwarm
	case "nodes":
		return OperationDockerNodes
	case "services":
		return OperationDockerServices
	case "secrets":
		return OperationDockerSecrets
	case "configs":
		return OperationDockerConfigs
	case "tasks":
		return OperationDockerTasks
	case "plugins":
		return OperationDockerPlugins
	case "info":
		return OperationDockerInfo
	case "_ping":
		return OperationDockerPing
	case "version":
		return OperationDockerVersion
	case "events":
		return OperationDockerEvents
	case "system/df":
		return OperationDockerSystem
	case "session":
		return OperationDockerSessions
	case "distribution":
		return OperationDockerDistributions
	case "commit":
		return OperationDockerCommit
	case "build":
		return OperationDockerBuilds
	default:
		return OperationPortainerAdmin
	}
}

func dockerImageOperationAuthorization(url, method string) Authorization {
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
				return OperationDockerImageList
			} else if resource == "search" {
				return OperationDockerImageSearch
			} else if resource == "get" {
				return OperationDockerImageGetAll
			}
		case "get":
			return OperationDockerImageGet
		case "history":
			return OperationDockerImageHistory
		case "json":
			return OperationDockerImageInspect
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
				return OperationDockerImageLoad
			} else if resource == "create" {
				return OperationDockerImageCreate
			} else if resource == "prune" {
				return OperationDockerImagePrune
			}
		case "push":
		case "tag":
		}
	case http.MethodDelete:
		//// DELETE
		//	router.NewDeleteRoute("/images/{name:.*}", r.deleteImages)
		if resource != "" && action == "" {
			return OperationDockerImageDelete
		}
	}

	return OperationDockerImages
}

func dockerContainerOperationAuthorization(url, method string) Authorization {
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
			return OperationDockerContainerArchiveInfo
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
				return OperationDockerContainerList
			}
		case "export":
			return OperationDockerContainerExport
		case "changes":
			return OperationDockerContainerChanges
		case "json":
			return OperationDockerContainerInspect
		case "top":
			return OperationDockerContainerTop
		case "logs":
			return OperationDockerContainerLogs
		case "stats":
			return OperationDockerContainerStats
		case "attach/ws":
			return OperationDockerContainerAttachWebsocket
		case "archive":
			return OperationDockerContainerArchive
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
				return OperationDockerContainerCreate
			} else if resource == "prune" {
				return OperationDockerContainerPrune
			}
		case "kill":
			return OperationDockerContainerKill
		case "pause":
			return OperationDockerContainerPause
		case "unpause":
			return OperationDockerContainerUnpause
		case "restart":
			return OperationDockerContainerRestart
		case "start":
			return OperationDockerContainerStart
		case "stop":
			return OperationDockerContainerStop
		case "wait":
			return OperationDockerContainerWait
		case "resize":
			return OperationDockerContainerResize
		case "attach":
			return OperationDockerContainerAttach
		case "exec":
			return OperationDockerContainerExec
		case "rename":
			return OperationDockerContainerRename
		case "update":
			return OperationDockerContainerUpdate
		}
	case http.MethodPut:
		//// PUT
		//	router.NewPutRoute("/containers/{name:.*}/archive", r.putContainersArchive),
		if action == "archive" {
			return OperationDockerContainerPutContainerArchive
		}
	case http.MethodDelete:
		//// DELETE
		//	router.NewDeleteRoute("/containers/{name:.*}", r.deleteContainers),
		if resource != "" && action == "" {
			return OperationDockerContainerDelete
		}
	}

	// TODO: default generic resource operation?
	return OperationDockerContainers
}

//func getLastResourceAndSubResource(regex *regexp.Regexp, url string) map[string]string {
//	lastMatch := findNamedMatches(regex, url)
//	lastMatchSize := len(lastMatch)
//
//	for lastMatchSize > 0 {
//		fmt.Printf("Inter %s\n", lastMatch["subresource"])
//		newMatch := findNamedMatches(regex, lastMatch["subresource"])
//		if len(newMatch) == 0 {
//			break
//		}
//		lastMatch = newMatch
//		lastMatchSize = len(lastMatch)
//	}
//
//	return lastMatch
//}

//func dockerImageOperationPermission(url, method string) Permission {
//	routeResource := "images"
//	routePattern := regexp.MustCompile(`/` + routeResource + `/(?P<resource>[^/]*)/?(?P<action>.*)?`)
//	lastMatch := findNamedMatches(routePattern, url)
//	fmt.Printf("IMAGE OPERATION: %s,%s | resource: %s | action: %s\n", method, url, lastMatch["resource"], lastMatch["action"])
//	resource := lastMatch["resource"]
//	action := lastMatch["action"]
//
//	switch method {
//	case http.MethodGet:
//		//// GET
//		//router.NewGetRoute("/images/json", r.getImagesJSON),
//		//	router.NewGetRoute("/images/search", r.getImagesSearch),
//		//	router.NewGetRoute("/images/get", r.getImagesGet),
//		//	router.NewGetRoute("/images/{name:.*}/get", r.getImagesGet),
//		//	router.NewGetRoute("/images/{name:.*}/history", r.getImagesHistory),
//		//	router.NewGetRoute("/images/{name:.*}/json", r.getImagesByName),
//		switch action {
//		case "":
//			if resource == "json" {
//				return DockerImageList
//			} else if resource == "search" {
//				return DockerImageSearch
//			} else if resource == "get" {
//				return DockerImageGetAll
//			}
//		case "get":
//			return DockerImageGet
//		case "history":
//			return DockerImageHistory
//		case "json":
//			return DockerImageInspect
//		}
//	case http.MethodPost:
//		//// POST
//		//	router.NewPostRoute("/images/load", r.postImagesLoad),
//		//	router.NewPostRoute("/images/create", r.postImagesCreate),
//		//	router.NewPostRoute("/images/{name:.*}/push", r.postImagesPush),
//		//	router.NewPostRoute("/images/{name:.*}/tag", r.postImagesTag),
//		//	router.NewPostRoute("/images/prune", r.postImagesPrune),
//		switch action {
//		case "":
//			if resource == "load" {
//				return DockerImageLoad
//			} else if resource == "create" {
//				return DockerImageCreate
//			} else if resource == "prune" {
//				return DockerImagePrune
//			}
//		case "push":
//		case "tag":
//		}
//	case http.MethodDelete:
//		//// DELETE
//		//	router.NewDeleteRoute("/images/{name:.*}", r.deleteImages)
//		if resource != "" && action == "" {
//			return DockerImageDelete
//		}
//	}
//
//	return PortainerAdmin
//}

//// Based on the routes available at
//// https://github.com/moby/moby/blob/c12f09bf99b54f274a5ae241dd154fa74020cbab/api/server/router/container/container.go#L31
//func dockerContainerOperationPermission(url, method string) Permission {
//	//fmt.Printf("Docker operation: %s\n", reqURL)
//
//	//routePattern := regexp.MustCompile(`(?P<resource>\w+)/?(?P<subresource>.*)?`)
//	routeResource := "containers"
//	routePattern := regexp.MustCompile(`/` + routeResource + `/(?P<resource>[^/]*)/?(?P<action>.*)?`)
//	lastMatch := findNamedMatches(routePattern, url)
//	fmt.Printf("CONTAINER OPERATION: %s,%s | resource: %s | action: %s\n", method, url, lastMatch["resource"], lastMatch["action"])
//	resource := lastMatch["resource"]
//	action := lastMatch["action"]
//
//	switch method {
//	case http.MethodHead:
//		//// HEAD
//		//router.NewHeadRoute("/containers/{name:.*}/archive", r.headContainersArchive),
//		if action == "archive" {
//			return DockerContainerArchiveInfo
//		}
//	case http.MethodGet:
//		//// GET
//		//	router.NewGetRoute("/containers/json", r.getContainersJSON),
//		//	router.NewGetRoute("/containers/{name:.*}/export", r.getContainersExport),
//		//	router.NewGetRoute("/containers/{name:.*}/changes", r.getContainersChanges),
//		//	router.NewGetRoute("/containers/{name:.*}/json", r.getContainersByName),
//		//	router.NewGetRoute("/containers/{name:.*}/top", r.getContainersTop),
//		//	router.NewGetRoute("/containers/{name:.*}/logs", r.getContainersLogs),
//		//	router.NewGetRoute("/containers/{name:.*}/stats", r.getContainersStats),
//		//	router.NewGetRoute("/containers/{name:.*}/attach/ws", r.wsContainersAttach),
//		//	router.NewGetRoute("/exec/{id:.*}/json", r.getExecByID),
//		//	router.NewGetRoute("/containers/{name:.*}/archive", r.getContainersArchive),
//		switch action {
//		case "":
//			if resource == "json" {
//				return DockerContainerList
//			}
//		case "export":
//			return DockerContainerExport
//		case "changes":
//			return DockerContainerChanges
//		case "json":
//			return DockerContainerInspect
//		case "top":
//			return DockerContainerTop
//		case "logs":
//			return DockerContainerLogs
//		case "stats":
//			return DockerContainerStats
//		case "attach/ws":
//			return DockerContainerAttachWebsocket
//		case "archive":
//			return DockerContainerArchive
//		}
//	case http.MethodPost:
//		//// POST
//		//	router.NewPostRoute("/containers/create", r.postContainersCreate),
//		//	router.NewPostRoute("/containers/{name:.*}/kill", r.postContainersKill),
//		//	router.NewPostRoute("/containers/{name:.*}/pause", r.postContainersPause),
//		//	router.NewPostRoute("/containers/{name:.*}/unpause", r.postContainersUnpause),
//		//	router.NewPostRoute("/containers/{name:.*}/restart", r.postContainersRestart),
//		//	router.NewPostRoute("/containers/{name:.*}/start", r.postContainersStart),
//		//	router.NewPostRoute("/containers/{name:.*}/stop", r.postContainersStop),
//		//	router.NewPostRoute("/containers/{name:.*}/wait", r.postContainersWait),
//		//	router.NewPostRoute("/containers/{name:.*}/resize", r.postContainersResize),
//		//	router.NewPostRoute("/containers/{name:.*}/attach", r.postContainersAttach),
//		//	router.NewPostRoute("/containers/{name:.*}/copy", r.postContainersCopy), // Deprecated since 1.8, Errors out since 1.12
//		//	router.NewPostRoute("/containers/{name:.*}/exec", r.postContainerExecCreate),
//		//	router.NewPostRoute("/exec/{name:.*}/start", r.postContainerExecStart),
//		//	router.NewPostRoute("/exec/{name:.*}/resize", r.postContainerExecResize),
//		//	router.NewPostRoute("/containers/{name:.*}/rename", r.postContainerRename),
//		//	router.NewPostRoute("/containers/{name:.*}/update", r.postContainerUpdate),
//		//	router.NewPostRoute("/containers/prune", r.postContainersPrune),
//		//	router.NewPostRoute("/commit", r.postCommit),
//		switch action {
//		case "":
//			if resource == "create" {
//				return DockerContainerCreate
//			} else if resource == "prune" {
//				return DockerContainerPrune
//			}
//		case "kill":
//			return DockerContainerKill
//		case "pause":
//			return DockerContainerPause
//		case "unpause":
//			return DockerContainerUnpause
//		case "restart":
//			return DockerContainerRestart
//		case "start":
//			return DockerContainerStart
//		case "stop":
//			return DockerContainerStop
//		case "wait":
//			return DockerContainerWait
//		case "resize":
//			return DockerContainerResize
//		case "attach":
//			return DockerContainerAttach
//		case "exec":
//			return DockerContainerExec
//		case "rename":
//			return DockerContainerRename
//		case "update":
//			return DockerContainerUpdate
//		}
//	case http.MethodPut:
//		//// PUT
//		//	router.NewPutRoute("/containers/{name:.*}/archive", r.putContainersArchive),
//		if action == "archive" {
//			return DockerContainerPutContainerArchive
//		}
//	case http.MethodDelete:
//		//// DELETE
//		//	router.NewDeleteRoute("/containers/{name:.*}", r.deleteContainers),
//		if resource != "" && action == "" {
//			return DockerContainerDelete
//		}
//	}
//	//
//	//switch url {
//	//case "/containers/create":
//	//	return DockerContainerCreate
//	//case "/containers/prune":
//	//	return DockerContainerPrune
//	//case "/containers/json":
//	//	return DockerContainerList
//	//default:
//	//	// This section assumes /containers/**
//	//	if match, _ := path.Match("/containers/*/*", url); match {
//	//		// Handle /containers/{id}/{action} requests
//	//		//containerID := path.Base(path.Dir(requestPath))
//	//		action := path.Base(url)
//	//
//	//		if method == http.MethodPut {
//	//
//	//		}
//	//
//	//		switch action {
//	//		case "archive":
//	//			return DockerContainerArchive
//	//		case "json":
//	//			return DockerContainerInspect
//	//		case "stats":
//	//			return DockerContainerStats
//	//		case "logs":
//	//			return DockerContainerLogs
//	//		case "top":
//	//			return DockerContainerTop
//	//		}
//	//
//	//	} else if match, _ := path.Match("/containers/*", url); match {
//	//		// Handle /containers/{id} requests
//	//		//containerID := path.Base(requestPath)
//	//		if method == http.MethodDelete {
//	//			return DockerContainerDelete
//	//		}
//	//	}
//	//}
//
//	return PortainerAdmin
//}

//func convertURLtoDockerOperation(reqURL, method string) (Permission, OperationDomain) {
//	urlParts := strings.Split(reqURL, "/")
//	baseResource := urlParts[1]
//
//	domain := PortainerOperation
//	permission := PortainerAdmin
//
//	switch baseResource {
//	case "containers":
//		permission = dockerContainerOperationPermission(reqURL, method)
//		domain = DockerContainerOperation
//	case "images":
//		permission = dockerImageOperationPermission(reqURL, method)
//		domain = DockerImageOperation
//	case "networks":
//		permission = DockerNetworks
//		domain = DockerOperation
//	case "volumes":
//		permission = DockerVolumes
//		domain = DockerOperation
//	case "exec":
//		permission = DockerExec
//		domain = DockerOperation
//	case "swarm":
//		permission = DockerSwarm
//		domain = DockerOperation
//	case "nodes":
//		permission = DockerNodes
//		domain = DockerOperation
//	case "services":
//		permission = DockerServices
//		domain = DockerOperation
//	case "secrets":
//		permission = DockerSecrets
//		domain = DockerOperation
//	case "configs":
//		permission = DockerConfigs
//		domain = DockerOperation
//	case "tasks":
//		permission = DockerTasks
//		domain = DockerOperation
//	case "plugins":
//		permission = DockerPlugins
//		domain = DockerOperation
//	case "info":
//		permission = DockerInfo
//		domain = DockerOperation
//	case "_ping":
//		permission = DockerPing
//		domain = DockerOperation
//	case "version":
//		permission = DockerVersion
//		domain = DockerOperation
//	case "events":
//		permission = DockerEvents
//		domain = DockerOperation
//	case "system/df":
//		permission = DockerSystem
//		domain = DockerOperation
//	case "session":
//		permission = DockerSessions
//		domain = DockerOperation
//	case "distribution":
//		permission = DockerDistributions
//		domain = DockerOperation
//	case "commit":
//		permission = DockerCommit
//		domain = DockerOperation
//	case "build":
//		permission = DockerBuilds
//		domain = DockerOperation
//	}
//
//	//matches := findNamedMatches(dockerRule, reqURL)
//	//submatches := findNamedMatches(apiOperationRule, matches["operation"])
//	//fmt.Printf("Matches: %+v\n", matches)
//	//fmt.Printf("Submatches: %+v\n", findNamedMatches(dockerOperationRule, matches["operation"]))
//	fmt.Printf("Docker operation: %s | Base: %s\n", reqURL, baseResource)
//
//	return permission, domain
//	//return Portainer
//}

//func convertURLtoRegistryOperation(reqURL, method string) (Permission, OperationDomain) {
//	//matches := findNamedMatches(registryRule, reqURL)
//	//submatches := findNamedMatches(apiOperationRule, matches["operation"])
//	//fmt.Printf("Matches: %+v\n", matches)
//	//fmt.Printf("Submatches: %+v\n", findNamedMatches(dockerOperationRule, matches["operation"]))
//	//fmt.Printf("Registry manager operation: %s | Resource: %s | Sub-resource: %s\n", reqURL, submatches["resource"], submatches["subresource"])
//
//	return PortainerAdmin, PortainerOperation
//}

//func convertURLtoOperation(reqURL, method string) (Permission, OperationDomain) {
//
//	if dockerRule.MatchString(reqURL) {
//		match := dockerRule.FindStringSubmatch(reqURL)
//		//context = "endpoint"
//		//contextDetails = match[1]
//		//s = strings.TrimPrefix(s, "¡¡¡Hello, ")
//		return convertURLtoDockerOperation(strings.TrimPrefix(reqURL, "/"+match[1]+"/docker"), method)
//	} else if registryRule.MatchString(reqURL) {
//		//match := registryRule.FindStringSubmatch(url)
//		//context = "registry"
//		//contextDetails = match[1]
//		return convertURLtoRegistryOperation(reqURL, method)
//	} else {
//		//fmt.Printf("Portainer operation: %s | -\n", reqURL)
//	}
//
//	//uri, err := url.Parse(reqURL)
//	//if err != nil {
//	//	fmt.Println(err)
//	//}
//
//	//fmt.Printf("Base: %s\n", path.Base(reqURL))
//	//fmt.Printf("Dir: %s\n", path.Dir(reqURL))
//	//match := operationRule.FindStringSubmatch(url)
//	//fmt.Printf("Match: %+v", match)
//
//	return PortainerAdmin, PortainerOperation
//}

//func requiredPermissionBasedOnURL(url, method string) Permission {
//	var permMap = map[string]map[string]Permission{
//		"/endpoints": map[string]Permission{
//			http.MethodPost: PortainerEndpointCreate,
//		},
//	}
//	return permMap[url][method]
//}
//
