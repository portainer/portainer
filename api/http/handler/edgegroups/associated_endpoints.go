package edgegroups

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/roar"
)

func getTrustedEndpoints(tx dataservices.DataStoreTx, endpointIDs roar.Roar[portainer.EndpointID]) ([]portainer.EndpointID, error) {
	var innerErr error

	results := []portainer.EndpointID{}

	endpointIDs.Iterate(func(endpointID portainer.EndpointID) bool {
		endpoint, err := tx.Endpoint().Endpoint(endpointID)
		if err != nil {
			innerErr = err

			return false
		}

		if !endpoint.UserTrusted {
			return true
		}

		results = append(results, endpoint.ID)

		return true
	})

	return results, innerErr
}
