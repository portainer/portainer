package migrator

import (
	"path"
	"testing"
	"time"

	"github.com/boltdb/bolt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/portainer/portainer/api/bolt/settings"
	"github.com/stretchr/testify/assert"
)

func TestMigrateAdminGroupSearchSettings(t *testing.T) {
	databasePath := path.Join(t.TempDir(), "portainer-ee-mig-32.db")
	dbConn, err := bolt.Open(databasePath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	assert.NoError(t, err, "failed to init DB connection")
	defer dbConn.Close()

	internalDBConn := &internal.DbConnection{DB: dbConn}
	settingsService, err := settings.NewService(internalDBConn)
	assert.NoError(t, err, "failed to init settings service")
	settingsService.UpdateSettings(&portainer.Settings{})

	m := &Migrator{
		db:              dbConn,
		settingsService: settingsService,
	}
	err = m.updateAdminGroupSearchSettingsToDB32()
	assert.NoError(t, err, "failed to update settings")

	updatedSettings, err := settingsService.Settings()
	assert.NoError(t, err, "failed to fetch updated settings")
	assert.NotNil(t, updatedSettings.LDAPSettings.AdminGroupSearchSettings)

}
