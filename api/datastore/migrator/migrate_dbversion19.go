package migrator

import (
	"strings"
)

const scheduleScriptExecutionJobType = 1

func (m *Migrator) updateUsersToDBVersion20() error {
	migrateLog.Info("- updating user authentication")
	return m.authorizationService.UpdateUsersAuthorizations()
}

func (m *Migrator) updateSettingsToDBVersion20() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	legacySettings.AllowVolumeBrowserForRegularUsers = false

	return m.settingsService.UpdateSettings(legacySettings)
}

func (m *Migrator) updateSchedulesToDBVersion20() error {
	migrateLog.Info("- updating schedules")
	legacySchedules, err := m.scheduleService.Schedules()
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

			err := m.scheduleService.UpdateSchedule(schedule.ID, &schedule)
			if err != nil {
				return err
			}
		}

	}

	return nil
}
