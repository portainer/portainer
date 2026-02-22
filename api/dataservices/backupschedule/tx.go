package backupschedule

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.BackupSchedule, portainer.BackupScheduleID]
}

func (service ServiceTx) GetNextIdentifier() int {
	return service.Tx.GetNextIdentifier(BucketName)
}

func (service ServiceTx) Create(schedule *portainer.BackupSchedule) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			schedule.ID = portainer.BackupScheduleID(id)
			return int(schedule.ID), schedule
		},
	)
}
