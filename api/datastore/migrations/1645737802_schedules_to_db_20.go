package migrations

import (
	"strings"

	"github.com/portainer/portainer/api/datastore/migrations/types"
)

const scheduleScriptExecutionJobType = 1

func init() {
	migrator.AddMigration(types.Migration{
		Version:   19,
		Timestamp: 1645737802,
		Up:        v19_up_schedules_to_db_20,
		Down:      v19_down_schedules_to_db_20,
		Name:      "schedules to db 20",
	})
}

func v19_up_schedules_to_db_20() error {
	legacySchedules, err := migrator.store.ScheduleService.Schedules()
	if err != nil {
		return err
	}

	for _, schedule := range legacySchedules {
		if schedule.JobType == scheduleScriptExecutionJobType {
			if schedule.CronExpression == "0 0 * * *" {
				schedule.CronExpression = "0 * * * *"
			} else if schedule.CronExpression == "0 0 0/2 * *" {
				schedule.CronExpression = "0 */2 * * *"
			} else if schedule.CronExpression == "0 0 0 * *" {
				schedule.CronExpression = "0 0 * * *"
			} else {
				revisedCronExpression := strings.Split(schedule.CronExpression, " ")
				if len(revisedCronExpression) == 5 {
					continue
				}

				revisedCronExpression = revisedCronExpression[1:]
				schedule.CronExpression = strings.Join(revisedCronExpression, " ")
			}

			err := migrator.store.ScheduleService.UpdateSchedule(schedule.ID, &schedule)
			if err != nil {
				return err
			}
		}

	}

	return nil
}

func v19_down_schedules_to_db_20() error {
	return nil
}
