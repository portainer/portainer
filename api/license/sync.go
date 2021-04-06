package license

import (
	"log"
	"time"

	"github.com/portainer/liblicense/master"
)

const (
	syncInterval = 24 * time.Hour
)

func (service *Service) startSyncLoop() error {
	err := service.syncLicenses()
	if err != nil {
		return err
	}

	ticker := time.NewTicker(syncInterval)

	go (func() {
		for {
			select {
			case <-service.shutdownCtx.Done():
				log.Println("[DEBUG] [internal,license] [message: shutting down License service]")
				ticker.Stop()
				return
			case <-ticker.C:
				service.syncLicenses()
			}
		}
	})()

	return nil
}

func (service *Service) syncLicenses() error {
	licenses, err := service.Licenses()
	if err != nil {
		return err
	}

	licensesToRemove := []string{}

	for _, license := range licenses {
		valid, err := master.ValidateLicense(&license)
		if err != nil || !valid {
			licensesToRemove = append(licensesToRemove, license.LicenseKey)
		}
	}

	for _, licenseKey := range licensesToRemove {
		err := service.revokeLicense(licenseKey)
		if err != nil {
			return err
		}
	}

	return nil
}
