package migrator

import (
	"os"
	"path"
	"testing"
	"time"

	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/portainer/portainer/api/bolt/settings"
)

var (
	testingDBStorePath string
	testingDBFileName  string
	dummyLogoURL       string
)

func init() {
	testingDBStorePath, _ = os.Getwd()
	testingDBFileName = "portainer-ee-mig-30.db"
	dummyLogoURL = "example.com"
}

func initDBConn() (*bolt.DB, error) {
	databasePath := path.Join(testingDBStorePath, testingDBFileName)
	dbConn, err := bolt.Open(databasePath, 0600, &bolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return nil, err
	}

	return dbConn, nil
}

func initSettingsService(dbConn *bolt.DB) (*settings.Service, error) {
	internalDBConn := &internal.DbConnection{
		DB: dbConn,
	}
	settingsService, err := settings.NewService(internalDBConn)
	if err != nil {
		return nil, err
	}
	dummySettingsObj := map[string]interface{}{
		"LogoURL": dummyLogoURL,
	}
	if err := internal.UpdateObject(internalDBConn, "settings", []byte("SETTINGS"), dummySettingsObj); err != nil {
		return nil, err
	}
	return settingsService, nil
}

func TestUpdateSettingsToDB31(t *testing.T) {
	dbConn, err := initDBConn()
	if err != nil {
		t.Errorf("failed to init testing bolt DB connection: %v", err)
	}
	defer dbConn.Close()
	defer os.Remove(testingDBFileName)
	settingsService, err := initSettingsService(dbConn)
	if err != nil {
		t.Errorf("failed to init testing settings service: %v", err)
	}
	m := &Migrator{
		db:              dbConn,
		settingsService: settingsService,
	}
	if err := m.updateSettingsToDB31(); err != nil {
		t.Errorf("failed to update settings: %v", err)
	}
	updatedSettings, err := m.settingsService.Settings()
	if err != nil {
		t.Errorf("failed to retrieve the updated settings: %v", err)
	}
	if updatedSettings.LogoURL != dummyLogoURL {
		t.Errorf("unexpected value changes in the updated settings, want LogoURL value: %s, got LogoURL value: %s", dummyLogoURL, updatedSettings.LogoURL)
	}
	if updatedSettings.OAuthSettings.SSO != false {
		t.Errorf("unexpected default OAuth SSO setting, want: false, got: %t", updatedSettings.OAuthSettings.SSO)
	}
	if updatedSettings.OAuthSettings.LogoutURI != "" {
		t.Errorf("unexpected default OAuth HideInternalAuth setting, want:, got: %s", updatedSettings.OAuthSettings.LogoutURI)
	}
}
