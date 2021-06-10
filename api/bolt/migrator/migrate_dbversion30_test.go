package migrator

import (
	"os"
	"testing"

	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api/bolt/settings"
)

var (
	testingDBStorePath string
	testingDBFileName  string
	dummyLogoURL       string
	dbConn             *bolt.DB
	settingsService    *settings.Service
)

func setup() error {
	testingDBStorePath, _ = os.Getwd()
	testingDBFileName = "portainer-ee-mig-30.db"
	dummyLogoURL = "example.com"
	var err error
	dbConn, err = initTestingDBConn(testingDBStorePath, testingDBFileName)
	if err != nil {
		return err
	}
	dummySettingsObj := map[string]interface{}{
		"LogoURL": dummyLogoURL,
	}
	settingsService, err = initTestingSettingsService(dbConn, dummySettingsObj)
	if err != nil {
		return err
	}
	return nil
}

func TestUpdateSettingsToDB31(t *testing.T) {
	if err := setup(); err != nil {
		t.Errorf("failed to complete testing setups, err: %v", err)
	}
	defer dbConn.Close()
	defer os.Remove(testingDBFileName)
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
