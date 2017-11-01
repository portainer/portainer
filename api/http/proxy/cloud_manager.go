package proxy

import (
	"github.com/orcaman/concurrent-map"
	"github.com/portainer/portainer"
)

// CloudManager represents a service used to manage cloud provider proxies.
type CloudManager struct {
	proxyFactory *proxyFactory
	proxies      cmap.ConcurrentMap
}

// NewCloudManager initializes a new proxy Service
func NewCloudManager(resourceControlService portainer.ResourceControlService, teamMembershipService portainer.TeamMembershipService, settingsService portainer.SettingsService) *CloudManager {
	return &CloudManager{
		proxies: cmap.New(),
		proxyFactory: &proxyFactory{
			ResourceControlService: resourceControlService,
			TeamMembershipService:  teamMembershipService,
			SettingsService:        settingsService,
		},
	}
}