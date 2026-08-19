package migrator

import (
	"github.com/segmentio/encoding/json"

	"github.com/rs/zerolog/log"
)

func (migrator *Migrator) migratePendingActionsDataForDB130() error {
	log.Info().Msg("Migrating pending actions data")

	pendingActions, err := migrator.pendingActionsService.ReadAll()
	if err != nil {
		return err
	}

	for _, pa := range pendingActions {
		actionData, err := json.Marshal(pa.ActionData)
		if err != nil {
			return err
		}

		pa.ActionData = string(actionData)

		// Update the pending action
		err = migrator.pendingActionsService.Update(pa.ID, &pa)
		if err != nil {
			return err
		}
	}

	return nil
}
