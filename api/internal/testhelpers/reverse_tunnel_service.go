package testhelpers

import portainer "github.com/portainer/portainer/api"

type ReverseTunnelService struct{}

func (r ReverseTunnelService) StartTunnelServer(addr, port string, snapshotService portainer.SnapshotService) error {
	return nil
}
func (r ReverseTunnelService) GenerateEdgeKey(url, host string, endpointIdentifier int) string {
	return "nil"
}
func (r ReverseTunnelService) SetTunnelStatusToActive(endpointID portainer.EndpointID) {}
func (r ReverseTunnelService) SetTunnelStatusToRequired(endpointID portainer.EndpointID) error {
	return nil
}
func (r ReverseTunnelService) SetTunnelStatusToIdle(endpointID portainer.EndpointID) {}
func (r ReverseTunnelService) GetTunnelDetails(endpointID portainer.EndpointID) *portainer.TunnelDetails {
	return nil
}
func (r ReverseTunnelService) AddEdgeJob(endpointID portainer.EndpointID, edgeJob *portainer.EdgeJob) {
}
func (r ReverseTunnelService) RemoveEdgeJob(edgeJobID portainer.EdgeJobID) {}
