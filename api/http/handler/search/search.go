package search

import (
	"net/http"
	"strings"
	"fmt"

	"github.com/portainer/portainer/api"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

type searchResponse struct {
	Results 	[]searchResult 	`json:"Results"`
	ResultCount int 			`json:"ResultCount"`
}

type searchResult struct {
	Label 			string 	`json:"Label"`
	ResultType 		string 	`json:"Type"`
	Environment 	string  `json:"Environment"`
	EnvironmentType string 	`json:"EnvironmentType"`
	ResourceID 		string  `json:"ResourceID"`
	EnvironmentID 	int		`json:"EnvironmentID"`
}

// @id Search
// @summary Search for resources 
// @description Search for any resource inside this Portainer instance (through snapshots).
// @description **Access policy**: authenticated
// @tags search
// @security jwt
// @produce json
// @param query query string true "Query used to search and filter resources"
// @success 200 {object} searchResponse "Success"
// @failure 400 "Bad request"
// @failure 500 "Server error"
// @router /search [get]
func (handler *Handler) search(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	query, err := request.RetrieveQueryParameter(r, "query", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: query", err}
	}
	query = strings.ToLower(query)

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve environments from the database", err}
	}

	results := make([]searchResult, 0)

	for _, endpoint := range endpoints {

		if match(endpoint.Name, query) {

			result := searchResult{
				Label: 				endpoint.Name,
				ResultType: 		"ENVIRONMENT", 
				EnvironmentType: 	envTypeFromEndpoint(&endpoint),
				EnvironmentID: 		int(endpoint.ID),
			}

			results = append(results, result)
		}

		if len(endpoint.Snapshots) > 0 {

			containers, _ := containerMatch(&endpoint, query)
			results = append(results, containers...)

			images, _ := imageMatch(&endpoint, query)
			results = append(results, images...)

			networks, _ := networkMatch(&endpoint, query)
			results = append(results, networks...)

			volumes, _ := volumeMatch(&endpoint, query)
			results = append(results, volumes...)

		}
	}

	searchResponse := searchResponse{
		Results: 		results,
		ResultCount: 	len(results),	
	}

	return response.JSON(w, searchResponse)
}

func volumeMatch(endpoint *portainer.Endpoint, query string) ([]searchResult, error) {
	results := make([]searchResult, 0)

	volumeRoot, ok := endpoint.Snapshots[0].SnapshotRaw.Volumes.(map[string]interface{})
	if !ok {
		fmt.Println("Unable to retrieve volume data from snapshot")
		return results, nil
	}

	if volumeRoot["Volumes"] == nil {
		fmt.Println("Unable to retrieve volume data from snapshot")
		return results, nil
	}
	
	volumes, ok := volumeRoot["Volumes"].([]interface{})
	if !ok {
		fmt.Println("Unable to retrieve volume data from snapshot")
		return results, nil
	}

	for _, volume := range volumes {

		volumeObject, ok := volume.(map[string]interface{})
		if !ok {
			fmt.Println("Unable to retrieve volume data from volumes snapshot")
			continue
		}

		name := volumeObject["Name"]
		if name == nil {
			continue
		}

		volumeName := name.(string)
		if match(volumeName, query) {
			result := searchResult{
				Label: 				volumeName,
				ResultType: 		"VOLUME", 
				Environment: 		endpoint.Name,
				EnvironmentType: 	envTypeFromEndpoint(endpoint),
				EnvironmentID: 		int(endpoint.ID),
				ResourceID:			volumeName,
			}
			results = append(results, result)
		}	
	}

	return results, nil
}

func networkMatch(endpoint *portainer.Endpoint, query string) ([]searchResult, error) {
	results := make([]searchResult, 0)

	networks, ok := endpoint.Snapshots[0].SnapshotRaw.Networks.([]interface{})
	if !ok {
		fmt.Println("Unable to retrieve networks data from snapshot")
		return results, nil
	}

	for _, network := range networks {

		networkObject, ok := network.(map[string]interface{})
		if !ok {
			fmt.Println("Unable to retrieve network data from networks snapshot")
			continue
		}

		name := networkObject["Name"]
		if name == nil {
			continue
		}

		id := networkObject["Id"]
		if id == nil {
			continue
		}

		networkName := name.(string)
		networkId := id.(string)
		if match(networkName, query) {
			result := searchResult{
				Label: 				networkName,
				ResultType: 		"NETWORK", 
				Environment: 		endpoint.Name,
				EnvironmentType: 	envTypeFromEndpoint(endpoint),
				EnvironmentID: 		int(endpoint.ID),
				ResourceID:			networkId,
			}
			results = append(results, result)
		}	
	}

	return results, nil
}

func imageMatch(endpoint *portainer.Endpoint, query string) ([]searchResult, error) {
	results := make([]searchResult, 0)

	images, ok := endpoint.Snapshots[0].SnapshotRaw.Images.([]interface{})
	if !ok {
		fmt.Println("Unable to retrieve images data from snapshot")
		return results, nil
	}

	for _, image := range images {

		imgObject, ok := image.(map[string]interface{})
		if !ok {
			fmt.Println("Unable to retrieve image data from images snapshot")
			continue
		}

		repoTags := imgObject["RepoTags"]
		if repoTags == nil {
			continue
		}

		id := imgObject["Id"]
		if id == nil {
			continue
		}
		imageId := id.(string)

		repoTagsArray := repoTags.([]interface{})
		if len(repoTagsArray) > 0 {
			
			for _, tag := range repoTagsArray {
				tagName := tag.(string)

				if match(tagName, query) {
					result := searchResult{
						Label: 				tagName,
						ResultType: 		"IMAGE", 
						Environment: 		endpoint.Name,
						EnvironmentType: 	envTypeFromEndpoint(endpoint),
						EnvironmentID: 		int(endpoint.ID),
						ResourceID:			imageId,
					}
					results = append(results, result)
				}	
			}
		}
	}

	return results, nil
}


func containerMatch(endpoint *portainer.Endpoint, query string) ([]searchResult, error) {
	results := make([]searchResult, 0)

	containers, ok := endpoint.Snapshots[0].SnapshotRaw.Containers.([]interface{})
	if !ok {
		fmt.Println("Unable to retrieve containers data from snapshot")
		return results, nil
	}

	for _, container := range containers {

		cntrObject, ok := container.(map[string]interface{})
		if !ok {
			fmt.Println("Unable to retrieve container data from containers snapshot")
			continue
		}

		cntrNameEntry := cntrObject["Names"]
		if cntrNameEntry == nil {
			continue
		}

		id := cntrObject["Id"]
		if id == nil {
			continue
		}
		containerId := id.(string)

		cntrNameArray := cntrNameEntry.([]interface{})
		if len(cntrNameArray) > 0 {
			
			containerName := cntrNameArray[0].(string)
			cName := strings.TrimPrefix(containerName, "/")

			if match(cName, query) {
				result := searchResult{
					Label: 				cName,
					ResultType: 		"CONTAINER",
					Environment: 		endpoint.Name,
					EnvironmentType: 	envTypeFromEndpoint(endpoint),
					EnvironmentID: 		int(endpoint.ID),
					ResourceID: 		containerId,
				}
				results = append(results, result)
			}
		}
	}

	return results, nil
}

func envTypeFromEndpoint(endpoint *portainer.Endpoint) string {
	switch endpoint.Type {
	case 1:
		return "docker"
	case 2:
		return "docker"
	case 3:
		return "azure"
	case 4:
		return "edge"
	case 5:
		return "kubernetes"
	case 6:
		return "kubernetes"
	case 7:
		return "edge"
	}

	return "unsupported"
}

func match(data, filter string) bool {
	return strings.Contains(data, filter);
}