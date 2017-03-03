package http

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"path"
	"strconv"
	"strings"

	"github.com/portainer/portainer"
)

type proxyTransport struct {
	ResourceControlService portainer.ResourceControlService
}

func (p *proxyTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	response, err := http.DefaultTransport.RoundTrip(req)

	userData := req.Context().Value(contextAuthenticationKey).(*portainer.TokenData)
	if userData.Role != portainer.AdministratorRole {
		err = p.proxyDockerRequests(req, response, userData.ID)
	}
	return response, err
}

func (p *proxyTransport) proxyDockerRequests(request *http.Request, response *http.Response, userID portainer.UserID) error {
	path := request.URL.Path

	if strings.HasPrefix(path, "/containers") {
		return p.handleContainerRequests(request, response, userID)
	} else if strings.HasPrefix(path, "/services") {
		return p.handleServiceRequests(request, response, userID)
	} else if strings.HasPrefix(path, "/volumes") {
		return p.handleVolumeRequests(request, response, userID)
	}

	return nil
}

func (p *proxyTransport) handleContainerRequests(request *http.Request, response *http.Response, userID portainer.UserID) error {
	requestPath := request.URL.Path

	if requestPath == "/containers/prune" {
		return writeAccessDeniedResponse(response)
	}
	if requestPath == "/containers/json" {
		return p.proxyContainerResponseWithResourceControl(response, userID)
	}
	// /containers/{id}/action
	if match, _ := path.Match("/containers/*/*", requestPath); match {
		resourceID := path.Base(path.Dir(requestPath))
		return p.proxyContainerResponseWithAccessControl(response, userID, resourceID)
	}

	return nil
}

func (p *proxyTransport) handleServiceRequests(request *http.Request, response *http.Response, userID portainer.UserID) error {
	requestPath := request.URL.Path

	if requestPath == "/services" {
		return p.proxyServiceResponseWithResourceControl(response, userID)
	}
	// /services/{id}
	if match, _ := path.Match("/services/*", requestPath); match {
		resourceID := path.Base(requestPath)
		return p.proxyServiceResponseWithAccessControl(response, userID, resourceID)
	}
	// /services/{id}/action
	if match, _ := path.Match("/services/*/*", requestPath); match {
		resourceID := path.Base(path.Dir(requestPath))
		return p.proxyServiceResponseWithAccessControl(response, userID, resourceID)
	}

	return nil
}

func (p *proxyTransport) handleVolumeRequests(request *http.Request, response *http.Response, userID portainer.UserID) error {
	requestPath := request.URL.Path

	if requestPath == "/volumes" {
		return p.proxyVolumeResponseWithResourceControl(response, userID)
	}
	if requestPath == "/volumes/prune" {
		return writeAccessDeniedResponse(response)
	}
	// /volumes/{name}
	if match, _ := path.Match("/volumes/*", requestPath); match {
		resourceID := path.Base(requestPath)
		return p.proxyVolumeResponseWithAccessControl(response, userID, resourceID)
	}
	return nil
}

func (p *proxyTransport) proxyContainerResponseWithAccessControl(response *http.Response, userID portainer.UserID, resourceID string) error {
	return nil
}

func (p *proxyTransport) proxyServiceResponseWithAccessControl(response *http.Response, userID portainer.UserID, resourceID string) error {
	rcs, err := p.ResourceControlService.ResourceControls(portainer.ServiceResourceControl)
	if err != nil {
		return err
	}

	userOwnedResources, err := getResourceIDsOwnedByUser(userID, rcs)
	if err != nil {
		return err
	}

	if !isStringInArray(resourceID, userOwnedResources) && isResourceIDInRCs(resourceID, rcs) {
		return writeAccessDeniedResponse(response)
	}
	return nil
}

func (p *proxyTransport) proxyVolumeResponseWithAccessControl(response *http.Response, userID portainer.UserID, resourceID string) error {
	rcs, err := p.ResourceControlService.ResourceControls(portainer.VolumeResourceControl)
	if err != nil {
		return err
	}

	userOwnedResources, err := getResourceIDsOwnedByUser(userID, rcs)
	if err != nil {
		return err
	}

	if !isStringInArray(resourceID, userOwnedResources) && isResourceIDInRCs(resourceID, rcs) {
		return writeAccessDeniedResponse(response)
	}
	return nil
}

func (p *proxyTransport) proxyContainerResponseWithResourceControl(response *http.Response, userID portainer.UserID) error {
	return nil
}

func (p *proxyTransport) proxyServiceResponseWithResourceControl(response *http.Response, userID portainer.UserID) error {
	responseData, err := getResponseData(response)
	if err != nil {
		return err
	}

	volumes, err := p.filterServices(userID, responseData)
	if err != nil {
		return err
	}

	err = rewriteVolumeResponse(response, volumes)
	if err != nil {
		return err
	}

	return nil
}

func (p *proxyTransport) proxyVolumeResponseWithResourceControl(response *http.Response, userID portainer.UserID) error {
	responseData, err := getResponseData(response)
	if err != nil {
		return err
	}

	volumes, err := p.filterVolumes(userID, responseData)
	if err != nil {
		return err
	}

	err = rewriteVolumeResponse(response, volumes)
	if err != nil {
		return err
	}

	return nil
}

func (p *proxyTransport) filterContainers(userID portainer.UserID, responseData interface{}) ([]interface{}, error) {
	responseDataArray := responseData.([]interface{})

	// containerRCs, err := p.ResourceControlService.ResourceControls(portainer.ContainerResourceControl)
	// if err != nil {
	// 	return nil, err
	// }
	//
	// serviceRCs, err := p.ResourceControlService.ResourceControls(portainer.ServiceResourceControl)
	// if err != nil {
	// 	return nil, err
	// }
	//
	// userOwnedContainerIDs, err := getResourceIDsOwnedByUser(userID, containerRCs)
	// if err != nil {
	// 	return nil, err
	// }
	//
	// userOwnedServiceContainers, err := getOwnedServiceContainers(responseDataArray, serviceRCs)
	// if err != nil {
	// 	return nil, err
	// }
	//
	// publicContainers := getPublicResources(responseDataArray, containerRCs, "Id")
	//
	// filteredResources := make([]interface{}, 0)
	//
	// for _, res := range responseDataArray {
	// 	jsonResource := res.(map[string]interface{})
	// 	resourceID := jsonResource["Id"].(string)
	// 	if isStringInArray(resourceID, userOwnedVolumeIDs) {
	// 		filteredResources = append(filteredResources, res)
	// 	}
	// }
	//
	// filteredResources = append(filteredResources, publicContainers...)
	return responseDataArray, nil
}

func (p *proxyTransport) filterServices(userID portainer.UserID, responseData interface{}) ([]interface{}, error) {
	responseDataArray := responseData.([]interface{})

	rcs, err := p.ResourceControlService.ResourceControls(portainer.ServiceResourceControl)
	if err != nil {
		return nil, err
	}

	userOwnedServiceIDs, err := getResourceIDsOwnedByUser(userID, rcs)
	if err != nil {
		return nil, err
	}

	publicServices := getPublicResources(responseDataArray, rcs, "ID")

	filteredResources := make([]interface{}, 0)

	for _, res := range responseDataArray {
		jsonResource := res.(map[string]interface{})
		resourceID := jsonResource["ID"].(string)
		if isStringInArray(resourceID, userOwnedServiceIDs) {
			filteredResources = append(filteredResources, res)
		}
	}

	filteredResources = append(filteredResources, publicServices...)
	return filteredResources, nil
}

func (p *proxyTransport) filterVolumes(userID portainer.UserID, responseData interface{}) ([]interface{}, error) {
	var responseDataArray []interface{}
	jsonObject := responseData.(map[string]interface{})
	if jsonObject["Volumes"] != nil {
		responseDataArray = jsonObject["Volumes"].([]interface{})
	}

	rcs, err := p.ResourceControlService.ResourceControls(portainer.VolumeResourceControl)
	if err != nil {
		return nil, err
	}

	userOwnedVolumeIDs, err := getResourceIDsOwnedByUser(userID, rcs)
	if err != nil {
		return nil, err
	}

	publicVolumes := getPublicResources(responseDataArray, rcs, "Name")

	filteredResources := make([]interface{}, 0)

	for _, res := range responseDataArray {
		jsonResource := res.(map[string]interface{})
		resourceID := jsonResource["Name"].(string)
		if isStringInArray(resourceID, userOwnedVolumeIDs) {
			filteredResources = append(filteredResources, res)
		}
	}

	filteredResources = append(filteredResources, publicVolumes...)
	return filteredResources, nil
}

func getResourceIDsOwnedByUser(userID portainer.UserID, rcs []portainer.ResourceControl) ([]string, error) {
	ownedResources := make([]string, 0)
	for _, rc := range rcs {
		if rc.OwnerID == userID {
			ownedResources = append(ownedResources, rc.ResourceID)
		}
	}
	return ownedResources, nil
}

func getOwnedServiceContainers(responseData []interface{}, serviceRCs []portainer.ResourceControl) []interface{} {
	ownedContainers := make([]interface{}, 0)
	for _, res := range responseData {
		jsonResource := res.(map[string]map[string]interface{})
		swarmServiceID := jsonResource["Labels"]["com.docker.swarm.service.id"]
		if swarmServiceID != nil {
			resourceID := swarmServiceID.(string)
			if isResourceIDInRCs(resourceID, serviceRCs) {
				ownedContainers = append(ownedContainers, res)
			}
		}
	}
	return ownedContainers
}

// func getPublicContainers(responseData []interface{}, containerRCs []portainer.ResourceControl, serviceRCs []portainer.ResourceControl) []interface{} {
// 	publicContainers := make([]interface{}, 0)
// 	for _, res := range responseData {
// 		jsonResource := res.(map[string]interface{})
// 		resourceID := jsonResource["Id"].(string)
// 		containerLabels := jsonResource["Labels"].(map[string]interface{})
//
// 		// if containerLabels != nil && containerLabels["com.docker.swarm.service.id"] != nil {
// 		//
// 		// }
// 		// if !isResourceIDInRCs(resourceID, rcs) {
// 		// 	publicResources = append(publicResources, res)
// 		// }
//
// 	}
// 	return publicContainers
// }

func getPublicResources(responseData []interface{}, rcs []portainer.ResourceControl, resourceIDKey string) []interface{} {
	publicResources := make([]interface{}, 0)
	for _, res := range responseData {
		jsonResource := res.(map[string]interface{})
		resourceID := jsonResource[resourceIDKey].(string)
		if !isResourceIDInRCs(resourceID, rcs) {
			publicResources = append(publicResources, res)
		}
	}
	return publicResources
}

func isStringInArray(target string, array []string) bool {
	for _, element := range array {
		if element == target {
			return true
		}
	}
	return false
}

func isResourceIDInRCs(resourceID string, rcs []portainer.ResourceControl) bool {
	for _, rc := range rcs {
		if resourceID == rc.ResourceID {
			return true
		}
	}
	return false
}

func getResponseData(response *http.Response) (interface{}, error) {
	var data interface{}
	if response.Body != nil {
		body, err := ioutil.ReadAll(response.Body)
		if err != nil {
			return nil, err
		}

		err = response.Body.Close()
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(body, &data)
		if err != nil {
			return nil, err
		}

		return data, nil
	}
	return nil, ErrEmptyResponseBody
}

func writeAccessDeniedResponse(response *http.Response) error {
	return rewriteResponse(response, portainer.ErrResourceAccessDenied, 403)
}

func rewriteVolumeResponse(response *http.Response, responseData interface{}) error {
	data := map[string]interface{}{}
	data["Volumes"] = responseData
	return rewriteResponse(response, data, 200)
}

func rewriteResponse(response *http.Response, newContent interface{}, statusCode int) error {
	jsonData, err := json.Marshal(newContent)
	if err != nil {
		return err
	}
	body := ioutil.NopCloser(bytes.NewReader(jsonData))
	response.StatusCode = statusCode
	response.Body = body
	response.ContentLength = int64(len(jsonData))
	response.Header.Set("Content-Length", strconv.Itoa(len(jsonData)))
	return nil
}

////////// DEPRECATE ///////

func rewriteResponseWithNewContent(response *http.Response, responseData interface{}, resourceLocationKey string) error {
	if resourceLocationKey != "" {
		tmpData := map[string]interface{}{}
		tmpData[resourceLocationKey] = responseData
		responseData = tmpData
	}
	return rewriteResponse(response, responseData, 200)
}

func (p *proxyTransport) proxyResponseWithAccessControl(response *http.Response, userID portainer.UserID, resourceID string, rcType portainer.ResourceControlType) error {
	rcs, err := p.ResourceControlService.ResourceControls(rcType)
	if err != nil {
		return err
	}

	userOwnedResources, err := getResourceIDsOwnedByUser(userID, rcs)
	if err != nil {
		return err
	}

	if !isStringInArray(resourceID, userOwnedResources) && isResourceIDInRCs(resourceID, rcs) {
		return writeAccessDeniedResponse(response)
	}
	return nil
}

func (p *proxyTransport) proxyResponseWithResourceControl(response *http.Response, userID portainer.UserID, resourceLocationKey, resourceIDKey string, rcType portainer.ResourceControlType) error {
	err := p.rewriteResponseWithFilteredResources(response, userID, resourceLocationKey, resourceIDKey, rcType)
	if err != nil {
		return err
	}

	return nil
}

func (p *proxyTransport) getFilteredResources(userID portainer.UserID, responseDataArray []interface{}, resourceIDKey string, rcType portainer.ResourceControlType) ([]interface{}, error) {
	rcs, err := p.ResourceControlService.ResourceControls(rcType)
	if err != nil {
		return nil, err
	}

	userOwnedResources, err := getResourceIDsOwnedByUser(userID, rcs)
	if err != nil {
		return nil, err
	}

	publicResourceData := getPublicResources(responseDataArray, rcs, resourceIDKey)
	filteredResourceData := filterResources(responseDataArray, userOwnedResources, resourceIDKey)
	filteredResourceData = append(filteredResourceData, publicResourceData...)

	// Also check for containers related to a service
	if rcType == portainer.ContainerResourceControl {
		serviceRCs, err := p.ResourceControlService.ResourceControls(portainer.ServiceResourceControl)
		if err != nil {
			return nil, err
		}

		userOwnedServiceResources, err := getResourceIDsOwnedByUser(userID, serviceRCs)
		if err != nil {
			return nil, err
		}

		// publicServiceResourcesData := getPublicServiceResources(filteredResourceData, serviceRCs)
		// filteredResourceData = append(filteredResourceData, filteredServiceResourceData...)

		// publicServiceResourceData := getPublicResources(filteredResourceData, serviceRCs, "ID")
		filteredServiceResourceData := filterContainersByServiceResource(filteredResourceData, userOwnedServiceResources)
		filteredResourceData = append(filteredResourceData, filteredServiceResourceData...)
	}

	return filteredResourceData, nil
}

func (p *proxyTransport) rewriteResponseWithFilteredResources(response *http.Response, userID portainer.UserID, resourceLocationKey, resourceIDKey string, rcType portainer.ResourceControlType) error {
	responseData, err := getResponseData(response)
	if err != nil {
		return err
	}

	var responseDataArray []interface{}
	if resourceLocationKey != "" {
		temporaryData := responseData.(map[string]interface{})
		if temporaryData[resourceLocationKey] != nil {
			responseDataArray = temporaryData[resourceLocationKey].([]interface{})
		}
	} else {
		responseDataArray = responseData.([]interface{})
	}

	filteredResourceData, err := p.getFilteredResources(userID, responseDataArray, resourceIDKey, rcType)
	if err != nil {
		return err
	}

	err = rewriteResponseWithNewContent(response, filteredResourceData, resourceLocationKey)
	if err != nil {
		return err
	}

	return nil
}

func filterContainersByServiceResource(resources []interface{}, serviceResourceIDs []string) []interface{} {
	filteredResources := make([]interface{}, 0)
	for _, res := range resources {
		jsonResource := res.(map[string]map[string]interface{})
		swarmServiceID := jsonResource["Labels"]["com.docker.swarm.service.id"]
		if swarmServiceID != nil {
			resourceID := swarmServiceID.(string)
			if isStringInArray(resourceID, serviceResourceIDs) {
				filteredResources = append(filteredResources, res)
			}
		}
	}
	return filteredResources
}

func filterResources(resources []interface{}, filteredResourceIDs []string, resourceIDKey string) []interface{} {
	filteredResources := make([]interface{}, 0)
	for _, res := range resources {
		jsonResource := res.(map[string]interface{})
		resourceID := jsonResource[resourceIDKey].(string)
		if isStringInArray(resourceID, filteredResourceIDs) {
			filteredResources = append(filteredResources, res)
		}
	}
	return filteredResources
}
