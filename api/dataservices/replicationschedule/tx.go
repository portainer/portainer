package replicationschedule

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.ReplicationSchedule, portainer.ReplicationScheduleID]
}

func (service ServiceTx) GetNextIdentifier() int {
	return service.Tx.GetNextIdentifier(BucketName)
}

func (service ServiceTx) Create(schedule *portainer.ReplicationSchedule) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			schedule.ID = portainer.ReplicationScheduleID(id)
			return int(schedule.ID), schedule
		},
	)
}
