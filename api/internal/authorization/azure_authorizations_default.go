package authorization

import (
	portainer "github.com/portainer/portainer/api"
)

// DefaultAzureAuthorizations returns a set of default azure authorizations based on user's role.
func DefaultAzureAuthorizations() map[portainer.RoleID]portainer.Authorizations {
	return map[portainer.RoleID]portainer.Authorizations{
		portainer.RoleIDEndpointAdmin: {
			portainer.OperationAzureSubscriptionsList:    true,
			portainer.OperationAzureSubscriptionGet:      true,
			portainer.OperationAzureProviderGet:          true,
			portainer.OperationAzureResourceGroupsList:   true,
			portainer.OperationAzureResourceGroupGet:     true,
			portainer.OperationAzureContainerGroupsList:  true,
			portainer.OperationAzureContainerGroupGet:    true,
			portainer.OperationAzureContainerGroupCreate: true,
			portainer.OperationAzureContainerGroupDelete: true,
		},
		portainer.RoleIDOperator: {
			portainer.OperationAzureSubscriptionsList:   true,
			portainer.OperationAzureSubscriptionGet:     true,
			portainer.OperationAzureProviderGet:         true,
			portainer.OperationAzureResourceGroupsList:  true,
			portainer.OperationAzureResourceGroupGet:    true,
			portainer.OperationAzureContainerGroupsList: true,
			portainer.OperationAzureContainerGroupGet:   true,
		},
		portainer.RoleIDHelpdesk: {
			portainer.OperationAzureSubscriptionsList:   true,
			portainer.OperationAzureSubscriptionGet:     true,
			portainer.OperationAzureProviderGet:         true,
			portainer.OperationAzureResourceGroupsList:  true,
			portainer.OperationAzureResourceGroupGet:    true,
			portainer.OperationAzureContainerGroupsList: true,
			portainer.OperationAzureContainerGroupGet:   true,
		},
		portainer.RoleIDStandardUser: {
			portainer.OperationAzureSubscriptionsList:    true,
			portainer.OperationAzureSubscriptionGet:      true,
			portainer.OperationAzureProviderGet:          true,
			portainer.OperationAzureResourceGroupsList:   true,
			portainer.OperationAzureResourceGroupGet:     true,
			portainer.OperationAzureContainerGroupsList:  true,
			portainer.OperationAzureContainerGroupGet:    true,
			portainer.OperationAzureContainerGroupCreate: true,
			portainer.OperationAzureContainerGroupDelete: true,
		},
		portainer.RoleIDReadonly: {
			portainer.OperationAzureSubscriptionsList:   true,
			portainer.OperationAzureSubscriptionGet:     true,
			portainer.OperationAzureProviderGet:         true,
			portainer.OperationAzureResourceGroupsList:  true,
			portainer.OperationAzureResourceGroupGet:    true,
			portainer.OperationAzureContainerGroupsList: true,
			portainer.OperationAzureContainerGroupGet:   true,
		},
	}
}
