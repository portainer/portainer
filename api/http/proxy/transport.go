package proxy

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"
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
	method := request.Method

	if strings.HasPrefix(path, "/containers") && method == http.MethodGet {
		return p.proxyResponseWithResourceControl(response, "", userID)
	} else if strings.HasPrefix(path, "/volumes") && method == http.MethodGet {
		return p.proxyResponseWithResourceControl(response, "volumes", userID)
	}
	return nil
}

func (p *proxyTransport) proxyResponseWithAccessControl(response *http.Response, userID portainer.UserID) error {
	userOwnedResources, err := p.getResourcesOwnedByUser(userID)
	if err != nil {
		return err
	}

	resourceID := "RETRIEVE_ME"
	if !isStringInArray(resourceID, userOwnedResources) {
		return rewriteResponse(response, &errorResponse{Err: "Access denied to resource"})
	}
	return nil
}

func (p *proxyTransport) proxyResponseWithResourceControl(response *http.Response, resourceLocationKey string, userID portainer.UserID) error {
	userOwnedResources, err := p.getResourcesOwnedByUser(userID)
	if err != nil {
		return err
	}

	if len(userOwnedResources) > 0 {
		err = rewriteResponseWithFilteredResources(response, resourceLocationKey, userOwnedResources)
		if err != nil {
			return err
		}
	}

	return nil
}

func isStringInArray(target string, array []string) bool {
	for _, element := range array {
		if element == target {
			return true
		}
	}
	return false
}

func filterResources(resources []interface{}, filteredResourceIDs []string) []interface{} {
	filteredResources := make([]interface{}, 0)
	for _, res := range resources {
		jsonResource := res.(map[string]interface{})
		resourceID := jsonResource["Id"].(string)
		if isStringInArray(resourceID, filteredResourceIDs) {
			filteredResources = append(filteredResources, resourceID)
		}
	}
	return filteredResources
}

func (p *proxyTransport) getResourcesOwnedByUser(userID portainer.UserID) ([]string, error) {
	rcs, err := p.ResourceControlService.ResourceControls()
	if err != nil {
		return nil, err
	}
	ownedResources := make([]string, 0)
	for _, rc := range rcs {
		if rc.OwnerID == userID {
			ownedResources = append(ownedResources, rc.ResourceID)
		}
	}
	return ownedResources, nil
}

func getResponseData(response *http.Response) (interface{}, error) {
	var data interface{}
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

func rewriteResponse(response *http.Response, responseData interface{}) error {
	jsonData, err := json.Marshal(responseData)
	if err != nil {
		return err
	}
	body := ioutil.NopCloser(bytes.NewReader(jsonData))
	response.Body = body
	response.ContentLength = int64(len(jsonData))
	response.Header.Set("Content-Length", strconv.Itoa(len(jsonData)))
	return nil
}

func rewriteResponseWithFilteredResources(response *http.Response, resourceLocationKey string, resourceIDs []string) error {
	responseData, err := getResponseData(response)
	if err != nil {
		return err
	}

	responseDataArray := responseData.([]interface{})
	if resourceLocationKey != "" {
		temporaryData := responseData.(map[string]interface{})
		responseDataArray = temporaryData[resourceLocationKey].([]interface{})
	}

	filterResources(responseDataArray, resourceIDs)
	err = rewriteResponse(response, responseData)
	if err != nil {
		return err
	}

	return nil
}
