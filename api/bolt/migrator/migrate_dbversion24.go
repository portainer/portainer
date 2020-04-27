package migrator

import (
	"github.com/gofrs/uuid"
	portainer "github.com/portainer/portainer/api"
)

func (m *Migrator) updateTelemetryToDB24() error {
	_, err := m.telemetryService.Telemetry()
	if err == portainer.ErrObjectNotFound {
		token, err := uuid.NewV4()
		if err != nil {
			return err
		}

		defaultTelemetry := &portainer.Telemetry{
			TelemetryID: token.String(),
		}

		return m.telemetryService.Update(defaultTelemetry)
	} else if err != nil {
		return err
	}

	return nil
}
