package authorization

import (
	portainer "github.com/portainer/portainer/api"
)

// DefaultK8sClusterAuthorizations returns a set of default k8s cluster-level authorizations
// based on user's role. The operations are supposed to be used in front-end.
func DefaultK8sClusterAuthorizations() map[portainer.RoleID]portainer.Authorizations {
	return map[portainer.RoleID]portainer.Authorizations{
		portainer.RoleIDEndpointAdmin: {
			portainer.OperationK8sAccessAllNamespaces:              true,
			portainer.OperationK8sAccessSystemNamespaces:           true,
			portainer.OperationK8sResourcePoolsR:                   true,
			portainer.OperationK8sResourcePoolsW:                   true,
			portainer.OperationK8sResourcePoolDetailsR:             true,
			portainer.OperationK8sResourcePoolDetailsW:             true,
			portainer.OperationK8sResourcePoolsAccessManagementRW:  true,
			portainer.OperationK8sApplicationsR:                    true,
			portainer.OperationK8sApplicationsW:                    true,
			portainer.OperationK8sApplicationDetailsR:              true,
			portainer.OperationK8sApplicationDetailsW:              true,
			portainer.OperationK8sApplicationConsoleRW:             true,
			portainer.OperationK8sApplicationsAdvancedDeploymentRW: true,
			portainer.OperationK8sConfigurationsR:                  true,
			portainer.OperationK8sConfigurationsW:                  true,
			portainer.OperationK8sConfigurationsDetailsR:           true,
			portainer.OperationK8sConfigurationsDetailsW:           true,
			portainer.OperationK8sVolumesR:                         true,
			portainer.OperationK8sVolumesW:                         true,
			portainer.OperationK8sVolumeDetailsR:                   true,
			portainer.OperationK8sVolumeDetailsW:                   true,
			portainer.OperationK8sClusterR:                         true,
			portainer.OperationK8sClusterW:                         true,
			portainer.OperationK8sClusterNodeR:                     true,
			portainer.OperationK8sClusterNodeW:                     true,
			portainer.OperationK8sClusterSetupRW:                   true,
			portainer.OperationK8sApplicationErrorDetailsR:         true,
		},
		portainer.RoleIDHelpdesk: {
			portainer.OperationK8sResourcePoolsR:           true,
			portainer.OperationK8sResourcePoolDetailsR:     true,
			portainer.OperationK8sApplicationsR:            true,
			portainer.OperationK8sApplicationDetailsR:      true,
			portainer.OperationK8sConfigurationsR:          true,
			portainer.OperationK8sConfigurationsDetailsR:   true,
			portainer.OperationK8sVolumesR:                 true,
			portainer.OperationK8sVolumeDetailsR:           true,
			portainer.OperationK8sClusterR:                 true,
			portainer.OperationK8sClusterNodeR:             true,
			portainer.OperationK8sApplicationErrorDetailsR: true,
		},
		portainer.RoleIDStandardUser: {
			portainer.OperationK8sResourcePoolsR:         true,
			portainer.OperationK8sResourcePoolDetailsR:   true,
			portainer.OperationK8sApplicationsR:          true,
			portainer.OperationK8sApplicationsW:          true,
			portainer.OperationK8sApplicationDetailsR:    true,
			portainer.OperationK8sApplicationDetailsW:    true,
			portainer.OperationK8sApplicationConsoleRW:   true,
			portainer.OperationK8sConfigurationsR:        true,
			portainer.OperationK8sConfigurationsW:        true,
			portainer.OperationK8sConfigurationsDetailsR: true,
			portainer.OperationK8sConfigurationsDetailsW: true,
			portainer.OperationK8sVolumesR:               true,
			portainer.OperationK8sVolumesW:               true,
			portainer.OperationK8sVolumeDetailsR:         true,
			portainer.OperationK8sVolumeDetailsW:         true,
		},
		portainer.RoleIDReadonly: {
			portainer.OperationK8sResourcePoolsR:         true,
			portainer.OperationK8sResourcePoolDetailsR:   true,
			portainer.OperationK8sApplicationsR:          true,
			portainer.OperationK8sApplicationDetailsR:    true,
			portainer.OperationK8sConfigurationsR:        true,
			portainer.OperationK8sConfigurationsDetailsR: true,
			portainer.OperationK8sVolumesR:               true,
			portainer.OperationK8sVolumeDetailsR:         true,
		},
	}
}

// DefaultK8sNamespaceAuthorizations returns a set of default k8s namespace-level authorizations
// based on user's role. The operations are supposed to be used in front-end.
func DefaultK8sNamespaceAuthorizations() map[portainer.RoleID]portainer.Authorizations {
	return map[portainer.RoleID]portainer.Authorizations{
		portainer.RoleIDEndpointAdmin: {
			portainer.OperationK8sAccessNamespaceRead:  true,
			portainer.OperationK8sAccessNamespaceWrite: true,
		},
		portainer.RoleIDHelpdesk: {
			portainer.OperationK8sAccessNamespaceRead: true,
		},
		portainer.RoleIDStandardUser: {
			portainer.OperationK8sAccessNamespaceRead:  true,
			portainer.OperationK8sAccessNamespaceWrite: true,
		},
		portainer.RoleIDReadonly: {
			portainer.OperationK8sAccessNamespaceRead: true,
		},
	}
}
