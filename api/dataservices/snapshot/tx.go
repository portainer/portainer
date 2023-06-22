package snapshot

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.Snapshot, portainer.EndpointID]
}

func (service ServiceTx) Create(snapshot *portainer.Snapshot) error {
	return service.Tx.CreateObjectWithId(BucketName, int(snapshot.EndpointID), snapshot)
}
