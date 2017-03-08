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

type (
	proxyTransport struct {
		transport              *http.Transport
		ResourceControlService portainer.ResourceControlService
	}
	resourceControlMetadata struct {
		OwnerID portainer.UserID `json:"OwnerId"`
	}
)

func (p *proxyTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	response, err := p.transport.RoundTrip(req)
	if err != nil {
		return response, err
	}

	err = p.proxyDockerRequests(req, response)
	return response, err
}

func (p *proxyTransport) proxyDockerRequests(request *http.Request, response *http.Response) error {
	path := request.URL.Path

	if strings.HasPrefix(path, "/containers") {
		return p.handleContainerRequests(request, response)
	} else if strings.HasPrefix(path, "/services") {
		return p.handleServiceRequests(request, response)
	} else if strings.HasPrefix(path, "/volumes") {
		return p.handleVolumeRequests(request, response)
	}

	return nil
}

func (p *proxyTransport) handleContainerRequests(request *http.Request, response *http.Response) error {
	requestPath := request.URL.Path
	userData := request.Context().Value(contextAuthenticationKey).(*portainer.TokenData)

	if requestPath == "/containers/prune" && userData.Role != portainer.AdministratorRole {
		return writeAccessDeniedResponse(response)
	}
	if requestPath == "/containers/json" {
		if userData.Role == portainer.AdministratorRole {
			return p.decorateContainerResponse(response)
		}
		return p.proxyContainerResponseWithResourceControl(response, userData.ID)
	}
	// /containers/{id}/action
	if match, _ := path.Match("/containers/*/*", requestPath); match {
		if userData.Role != portainer.AdministratorRole {
			resourceID := path.Base(path.Dir(requestPath))
			return p.proxyContainerResponseWithAccessControl(response, userData.ID, resourceID)
		}
	}

	return nil
}

func (p *proxyTransport) handleServiceRequests(request *http.Request, response *http.Response) error {
	requestPath := request.URL.Path
	userData := request.Context().Value(contextAuthenticationKey).(*portainer.TokenData)

	if requestPath == "/services" {
		if userData.Role == portainer.AdministratorRole {
			return p.decorateServiceResponse(response)
		}
		return p.proxyServiceResponseWithResourceControl(response, userData.ID)
	}
	// /services/{id}
	if match, _ := path.Match("/services/*", requestPath); match {
		if userData.Role != portainer.AdministratorRole {
			resourceID := path.Base(requestPath)
			return p.proxyServiceResponseWithAccessControl(response, userData.ID, resourceID)
		}
	}
	// /services/{id}/action
	if match, _ := path.Match("/services/*/*", requestPath); match {
		if userData.Role != portainer.AdministratorRole {
			resourceID := path.Base(path.Dir(requestPath))
			return p.proxyServiceResponseWithAccessControl(response, userData.ID, resourceID)
		}
	}

	return nil
}

func (p *proxyTransport) handleVolumeRequests(request *http.Request, response *http.Response) error {
	requestPath := request.URL.Path
	userData := request.Context().Value(contextAuthenticationKey).(*portainer.TokenData)

	if requestPath == "/volumes" {
		if userData.Role == portainer.AdministratorRole {
			return p.decorateVolumeResponse(response)
		}
		return p.proxyVolumeResponseWithResourceControl(response, userData.ID)
	}
	if requestPath == "/volumes/prune" && userData.Role != portainer.AdministratorRole {
		return writeAccessDeniedResponse(response)
	}
	// /volumes/{name}
	if match, _ := path.Match("/volumes/*", requestPath); match {
		if userData.Role != portainer.AdministratorRole {
			resourceID := path.Base(requestPath)
			return p.proxyVolumeResponseWithAccessControl(response, userData.ID, resourceID)
		}
	}
	return nil
}

func (p *proxyTransport) proxyContainerResponseWithAccessControl(response *http.Response, userID portainer.UserID, resourceID string) error {
	rcs, err := p.ResourceControlService.ResourceControls(portainer.ContainerResourceControl)
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

func (p *proxyTransport) decorateContainerResponse(response *http.Response) error {
	responseData, err := getResponseData(response)
	if err != nil {
		return err
	}

	containers, err := p.decorateContainers(responseData)
	if err != nil {
		return err
	}

	err = rewriteContainerResponse(response, containers)
	if err != nil {
		return err
	}

	return nil
}

func (p *proxyTransport) proxyContainerResponseWithResourceControl(response *http.Response, userID portainer.UserID) error {
	responseData, err := getResponseData(response)
	if err != nil {
		return err
	}

	containers, err := p.filterContainers(userID, responseData)
	if err != nil {
		return err
	}

	err = rewriteContainerResponse(response, containers)
	if err != nil {
		return err
	}

	return nil
}

func (p *proxyTransport) decorateServiceResponse(response *http.Response) error {
	responseData, err := getResponseData(response)
	if err != nil {
		return err
	}

	services, err := p.decorateServices(responseData)
	if err != nil {
		return err
	}

	err = rewriteServiceResponse(response, services)
	if err != nil {
		return err
	}

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

	err = rewriteServiceResponse(response, volumes)
	if err != nil {
		return err
	}

	return nil
}

func (p *proxyTransport) decorateVolumeResponse(response *http.Response) error {
	responseData, err := getResponseData(response)
	if err != nil {
		return err
	}

	volumes, err := p.decorateVolumes(responseData)
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

func (p *proxyTransport) decorateContainers(responseData interface{}) ([]interface{}, error) {
	responseDataArray := responseData.([]interface{})

	containerRCs, err := p.ResourceControlService.ResourceControls(portainer.ContainerResourceControl)
	if err != nil {
		return nil, err
	}

	serviceRCs, err := p.ResourceControlService.ResourceControls(portainer.ServiceResourceControl)
	if err != nil {
		return nil, err
	}

	decoratedResources := make([]interface{}, 0)

	for _, container := range responseDataArray {
		jsonObject := container.(map[string]interface{})
		containerID := jsonObject["Id"].(string)
		containerRC := getRCByResourceID(containerID, containerRCs)
		if containerRC != nil {
			decoratedObject := decorateWithResourceControlMetadata(jsonObject, containerRC.OwnerID)
			decoratedResources = append(decoratedResources, decoratedObject)
			continue
		}

		containerLabels := jsonObject["Labels"]
		if containerLabels != nil {
			jsonLabels := containerLabels.(map[string]interface{})
			serviceID := jsonLabels["com.docker.swarm.service.id"]
			if serviceID != nil {
				serviceRC := getRCByResourceID(serviceID.(string), serviceRCs)
				if serviceRC != nil {
					decoratedObject := decorateWithResourceControlMetadata(jsonObject, serviceRC.OwnerID)
					decoratedResources = append(decoratedResources, decoratedObject)
					continue
				}
			}
		}
		decoratedResources = append(decoratedResources, container)
	}

	return decoratedResources, nil
}

func (p *proxyTransport) filterContainers(userID portainer.UserID, responseData interface{}) ([]interface{}, error) {
	responseDataArray := responseData.([]interface{})

	containerRCs, err := p.ResourceControlService.ResourceControls(portainer.ContainerResourceControl)
	if err != nil {
		return nil, err
	}

	serviceRCs, err := p.ResourceControlService.ResourceControls(portainer.ServiceResourceControl)
	if err != nil {
		return nil, err
	}

	userOwnedContainerIDs, err := getResourceIDsOwnedByUser(userID, containerRCs)
	if err != nil {
		return nil, err
	}

	userOwnedServiceIDs, err := getResourceIDsOwnedByUser(userID, serviceRCs)
	if err != nil {
		return nil, err
	}

	publicContainers := getPublicContainers(responseDataArray, containerRCs, serviceRCs)

	filteredResources := make([]interface{}, 0)

	for _, container := range responseDataArray {
		jsonObject := container.(map[string]interface{})
		containerID := jsonObject["Id"].(string)
		if isStringInArray(containerID, userOwnedContainerIDs) {
			decoratedObject := decorateWithResourceControlMetadata(jsonObject, userID)
			filteredResources = append(filteredResources, decoratedObject)
			continue
		}

		containerLabels := jsonObject["Labels"]
		if containerLabels != nil {
			jsonLabels := containerLabels.(map[string]interface{})
			serviceID := jsonLabels["com.docker.swarm.service.id"]
			if serviceID != nil && isStringInArray(serviceID.(string), userOwnedServiceIDs) {
				decoratedObject := decorateWithResourceControlMetadata(jsonObject, userID)
				filteredResources = append(filteredResources, decoratedObject)
			}
		}
	}

	filteredResources = append(filteredResources, publicContainers...)
	return filteredResources, nil
}

func decorateWithResourceControlMetadata(object map[string]interface{}, userID portainer.UserID) map[string]interface{} {
	metadata := make(map[string]interface{})
	metadata["ResourceControl"] = resourceControlMetadata{
		OwnerID: userID,
	}
	object["Portainer"] = metadata
	return object
}

func (p *proxyTransport) decorateServices(responseData interface{}) ([]interface{}, error) {
	responseDataArray := responseData.([]interface{})

	rcs, err := p.ResourceControlService.ResourceControls(portainer.ServiceResourceControl)
	if err != nil {
		return nil, err
	}

	decoratedResources := make([]interface{}, 0)

	for _, service := range responseDataArray {
		jsonResource := service.(map[string]interface{})
		resourceID := jsonResource["ID"].(string)
		serviceRC := getRCByResourceID(resourceID, rcs)
		if serviceRC != nil {
			decoratedObject := decorateWithResourceControlMetadata(jsonResource, serviceRC.OwnerID)
			decoratedResources = append(decoratedResources, decoratedObject)
			continue
		}
		decoratedResources = append(decoratedResources, service)
	}

	return decoratedResources, nil
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
			decoratedObject := decorateWithResourceControlMetadata(jsonResource, userID)
			filteredResources = append(filteredResources, decoratedObject)
		}
	}

	filteredResources = append(filteredResources, publicServices...)
	return filteredResources, nil
}

func (p *proxyTransport) decorateVolumes(responseData interface{}) ([]interface{}, error) {
	var responseDataArray []interface{}
	jsonObject := responseData.(map[string]interface{})
	if jsonObject["Volumes"] != nil {
		responseDataArray = jsonObject["Volumes"].([]interface{})
	}

	rcs, err := p.ResourceControlService.ResourceControls(portainer.VolumeResourceControl)
	if err != nil {
		return nil, err
	}

	decoratedResources := make([]interface{}, 0)

	for _, volume := range responseDataArray {
		jsonResource := volume.(map[string]interface{})
		resourceID := jsonResource["Name"].(string)
		volumeRC := getRCByResourceID(resourceID, rcs)
		if volumeRC != nil {
			decoratedObject := decorateWithResourceControlMetadata(jsonResource, volumeRC.OwnerID)
			decoratedResources = append(decoratedResources, decoratedObject)
			continue
		}
		decoratedResources = append(decoratedResources, volume)
	}

	return decoratedResources, nil
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
			decoratedObject := decorateWithResourceControlMetadata(jsonResource, userID)
			filteredResources = append(filteredResources, decoratedObject)
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

func getPublicContainers(responseData []interface{}, containerRCs []portainer.ResourceControl, serviceRCs []portainer.ResourceControl) []interface{} {
	publicContainers := make([]interface{}, 0)
	for _, container := range responseData {
		jsonObject := container.(map[string]interface{})
		containerID := jsonObject["Id"].(string)
		if !isResourceIDInRCs(containerID, containerRCs) {
			containerLabels := jsonObject["Labels"]
			if containerLabels != nil {
				jsonLabels := containerLabels.(map[string]interface{})
				serviceID := jsonLabels["com.docker.swarm.service.id"]
				if serviceID == nil {
					publicContainers = append(publicContainers, container)
				} else if serviceID != nil && !isResourceIDInRCs(serviceID.(string), serviceRCs) {
					publicContainers = append(publicContainers, container)
				}
			} else {
				publicContainers = append(publicContainers, container)
			}
		}
	}

	return publicContainers
}

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

func getRCByResourceID(resourceID string, rcs []portainer.ResourceControl) *portainer.ResourceControl {
	for _, rc := range rcs {
		if resourceID == rc.ResourceID {
			return &rc
		}
	}
	return nil
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

func rewriteContainerResponse(response *http.Response, responseData interface{}) error {
	return rewriteResponse(response, responseData, 200)
}

func rewriteServiceResponse(response *http.Response, responseData interface{}) error {
	return rewriteResponse(response, responseData, 200)
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
