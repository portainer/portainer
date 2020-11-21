package license

import (
	"errors"
	"log"
	"time"

	"github.com/portainer/liblicense"
	"github.com/portainer/liblicense/master"
	portainer "github.com/portainer/portainer/api"
)

// Service represents a service for managing portainer licenses
type Service struct {
	repository portainer.LicenseRepository
	info       *portainer.LicenseInfo
	stopSignal chan struct{}
}

// NewService creates a new instance of Service
func NewService(repository portainer.LicenseRepository) *Service {
	return &Service{
		repository: repository,
		info:       nil,
		stopSignal: nil,
	}
}

// Start starts the service
func (service *Service) Start() error {
	return service.startSyncLoop()
}

// Info returns aggregation of the information about the existing licenses
func (service *Service) Info() (*portainer.LicenseInfo, error) {
	if service.info == nil {
		licenses, err := service.Licenses()
		if err != nil {
			return nil, err
		}

		service.info = aggregate(licenses)
	}

	return service.info, nil
}

// Licenses returns the list of the existing licenses
func (service *Service) Licenses() ([]liblicense.PortainerLicense, error) {
	return service.repository.Licenses()
}

// AddLicense adds the license to instance
func (service *Service) AddLicense(licenseKey string) (*liblicense.PortainerLicense, error) {
	licenses, err := service.Licenses()
	if err != nil {
		return nil, err
	}

	license, err := master.ParseLicenseKey(licenseKey)
	if err != nil {
		return nil, err
	}

	if license.Type == liblicense.PortainerLicenseTrial && len(licenses) > 0 {
		return nil, errors.New("Trial license can not be applied when there are existing licenses")
	}

	for _, existingLicense := range licenses {
		if existingLicense.LicenseKey == licenseKey {
			return nil, errors.New("License was already applied")
		}

		if existingLicense.Type == liblicense.PortainerLicenseTrial {
			err = service.repository.DeleteLicense(existingLicense.LicenseKey)
			if err != nil {
				return nil, err
			}

			log.Printf("[DEBUG] [msg: removing the existing trial license]")
		}
	}

	valid, err := master.ValidateLicense(license)
	if err != nil {
		return nil, err
	}

	if !valid {
		return nil, errors.New("License is invalid")
	}

	err = service.repository.AddLicense(license.LicenseKey, license)
	if err != nil {
		return nil, err
	}

	licenses, err = service.Licenses()
	if err != nil {
		return nil, err
	}

	service.info = aggregate(licenses)

	return license, nil
}

// DeleteLicense removes the license from instance
func (service *Service) DeleteLicense(licenseKey string) error {

	license, err := service.repository.License(licenseKey)
	if err != nil {
		return err
	}

	valid := isLicenseValid(*license)

	if valid {
		licenses, err := service.Licenses()
		if err != nil {
			return err
		}

		hasMoreValidLicenses := false
		for _, otherLicense := range licenses {
			if licenseKey != otherLicense.LicenseKey && isLicenseValid(otherLicense) {
				hasMoreValidLicenses = true
				break
			}
		}

		if !hasMoreValidLicenses {
			return errors.New("At least one valid license is expected")
		}
	}

	err = service.repository.DeleteLicense(licenseKey)
	if err != nil {
		return err
	}

	licenses, err := service.Licenses()
	if err != nil {
		return err
	}

	service.info = aggregate(licenses)

	return nil
}

// revokeLicense revokes the license
func (service *Service) revokeLicense(licenseKey string) error {
	license, err := service.repository.License(licenseKey)
	if err != nil {
		return err
	}

	license.Revoked = true

	err = service.repository.UpdateLicense(licenseKey, license)
	if err != nil {
		return err
	}

	licenses, err := service.Licenses()
	if err != nil {
		return err
	}

	service.info = aggregate(licenses)

	return nil
}

func aggregate(licenses []liblicense.PortainerLicense) *portainer.LicenseInfo {
	nodes := 0
	var expiresAt time.Time
	company := ""
	edition := liblicense.PortainerEE
	licenseType := liblicense.PortainerLicenseSubscription

	if len(licenses) == 0 {
		return &portainer.LicenseInfo{Valid: false}
	}

	hasValidLicenses := false

	for _, license := range licenses {
		valid := isLicenseValid(license)
		if !valid {
			continue
		}

		hasValidLicenses = true

		if license.Company != "" {
			company = license.Company
		}

		nodes = nodes + license.Nodes

		licenseExpiresAt := licenseExpiresAt(license)
		if licenseExpiresAt.Before(expiresAt) || expiresAt.IsZero() {
			expiresAt = licenseExpiresAt
		}

		if int(license.ProductEdition) < int(edition) {
			edition = license.ProductEdition
		}

		if license.Type == liblicense.PortainerLicenseTrial {
			licenseType = liblicense.PortainerLicenseTrial
		}

	}

	expiresAtUnix := expiresAt.Unix()
	if expiresAt.IsZero() {
		expiresAtUnix = 0
	}

	return &portainer.LicenseInfo{
		Company:        company,
		ProductEdition: edition,
		Nodes:          nodes,
		ExpiresAt:      expiresAtUnix,
		Type:           licenseType,
		Valid:          hasValidLicenses,
	}
}

func licenseExpiresAt(license liblicense.PortainerLicense) time.Time {
	return time.Unix(license.Created, 0).AddDate(0, 0, license.ExpiresAfter)
}

func isLicenseValid(license liblicense.PortainerLicense) bool {
	licenseExpiresAt := licenseExpiresAt(license)
	return licenseExpiresAt.After(time.Now()) && !license.Revoked
}
