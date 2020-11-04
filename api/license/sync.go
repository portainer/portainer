package license

import (
	"time"

	"github.com/portainer/liblicense/master"
)

const (
	syncInterval = 5 * time.Minute
)

func (service *Service) startSyncLoop() error {
	if service.stopSignal != nil {
		return nil
	}

	err := service.syncLicenses()
	if err != nil {
		return err
	}

	service.stopSignal = make(chan struct{})
	ticker := time.NewTicker(syncInterval)

	go (func() {
		for {
			select {
			case <-service.stopSignal:
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
