package security

import (
	portainer "github.com/portainer/portainer/api"
	"net/http"
	"path"
	"strings"
)

func getAzureOperationAuthorization(url, method string) portainer.Authorization {
	url = strings.Split(url, "?")[0]
	if matched, _ := path.Match("/subscriptions", url); matched {
		return azureSubscriptionsOperationAuthorization(url, method)
	} else if matched, _ := path.Match("/subscriptions/*", url); matched {
		return azureSubscriptionOperationAuthorization(url, method)
	} else if matched, _ := path.Match("/subscriptions/*/providers/*", url); matched {
		return azureProviderOperationAuthorization(url, method)
	} else if matched, _ := path.Match("/subscriptions/*/resourcegroups", url); matched {
		return azureResourceGroupsOperationAuthorization(url, method)
	} else if matched, _ := path.Match("/subscriptions/*/resourcegroups/*", url); matched {
		return azureResourceGroupOperationAuthorization(url, method)
	} else if matched, _ := path.Match("/subscriptions/*/providers/*/containerGroups", url); matched {
		return azureContainerGroupsOperationAuthorization(url, method)
	} else if matched, _ := path.Match("/subscriptions/*/resourceGroups/*/providers/*/containerGroups/*", url); matched {
		return azureContainerGroupOperationAuthorization(url, method)
	}

	return portainer.OperationAzureUndefined
}

// /subscriptions
func azureSubscriptionsOperationAuthorization(url, method string) portainer.Authorization {
	switch method {
	case http.MethodGet:
		return portainer.OperationAzureSubscriptionsList
	default:
		return portainer.OperationAzureUndefined
	}
}

// /subscriptions/*
func azureSubscriptionOperationAuthorization(url, method string) portainer.Authorization {
	switch method {
	case http.MethodGet:
		return portainer.OperationAzureSubscriptionGet
	default:
		return portainer.OperationAzureUndefined
	}
}

// /subscriptions/*/resourcegroups
func azureResourceGroupsOperationAuthorization(url, method string) portainer.Authorization {
	switch method {
	case http.MethodGet:
		return portainer.OperationAzureResourceGroupsList
	default:
		return portainer.OperationAzureUndefined
	}
}

// /subscriptions/*/resourcegroups/*
func azureResourceGroupOperationAuthorization(url, method string) portainer.Authorization {
	switch method {
	case http.MethodGet:
		return portainer.OperationAzureResourceGroupGet
	default:
		return portainer.OperationAzureUndefined
	}
}

// /subscriptions/*/providers/*
func azureProviderOperationAuthorization(url, method string) portainer.Authorization {
	switch method {
	case http.MethodGet:
		return portainer.OperationAzureProviderGet
	default:
		return portainer.OperationAzureUndefined
	}
}

// /subscriptions/*/providers/Microsoft.ContainerInstance/containerGroups
func azureContainerGroupsOperationAuthorization(url, method string) portainer.Authorization {
	switch method {
	case http.MethodGet:
		return portainer.OperationAzureContainerGroupsList
	default:
		return portainer.OperationAzureUndefined
	}
}

// /subscriptions/*/resourceGroups/*/providers/Microsoft.ContainerInstance/containerGroups/*
func azureContainerGroupOperationAuthorization(url, method string) portainer.Authorization {
	switch method {
	case http.MethodPut:
		return portainer.OperationAzureContainerGroupCreate
	case http.MethodGet:
		return portainer.OperationAzureContainerGroupGet
	case http.MethodDelete:
		return portainer.OperationAzureContainerGroupDelete
	default:
		return portainer.OperationAzureUndefined
	}
}
