package testhelpers

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database"
	"github.com/portainer/portainer/api/dataservices/edgejob"
)

type ReverseTunnelService struct{}

func (r ReverseTunnelService) StartTunnelServer(addr, port string, snapshotService portainer.SnapshotService) error {
	return nil
}
func (r ReverseTunnelService) GenerateEdgeKey(url, host string, endpointIdentifier int) string {
	return "nil"
}
func (r ReverseTunnelService) SetTunnelStatusToActive(endpointID database.EndpointID) {}
func (r ReverseTunnelService) SetTunnelStatusToRequired(endpointID database.EndpointID) error {
	return nil
}
func (r ReverseTunnelService) SetTunnelStatusToIdle(endpointID database.EndpointID) {}
func (r ReverseTunnelService) GetTunnelDetails(endpointID database.EndpointID) *portainer.TunnelDetails {
	return nil
}
func (r ReverseTunnelService) AddEdgeJob(endpointID database.EndpointID, edgeJob *edgejob.EdgeJob) {
}
func (r ReverseTunnelService) RemoveEdgeJob(edgeJobID edgejob.EdgeJobID) {}
