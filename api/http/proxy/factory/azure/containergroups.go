package azure

import (
	"fmt"
	"net/http"

	"github.com/portainer/portainer/api/http/proxy/factory/utils"
)

// proxy for /subscriptions/*/providers/Microsoft.ContainerInstance/containerGroups
func (transport *Transport) proxyContainerGroupsRequest(request *http.Request) (*http.Response, error) {
	switch request.Method {
	case http.MethodGet:
		return transport.proxyContainerGroupsGetRequest(request)
	default:
		return http.DefaultTransport.RoundTrip(request)
	}
}

func (transport *Transport) proxyContainerGroupsGetRequest(request *http.Request) (*http.Response, error) {
	response, err := http.DefaultTransport.RoundTrip(request)
	if err != nil {
		return nil, err
	}

	responseObject, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return nil, err
	}

	value, ok := responseObject["value"].([]interface{})
	if ok {
		context, err := transport.createAzureRequestContext(request)
		if err != nil {
			return response, err
		}

		decoratedValue := transport.decorateContainerGroups(value, context)
		filteredValue := transport.filterContainerGroups(decoratedValue, context)
		responseObject["value"] = filteredValue

		utils.RewriteResponse(response, responseObject, http.StatusOK)
	} else {
		return nil, fmt.Errorf("The container groups response has no value property")
	}

	return response, nil
}
