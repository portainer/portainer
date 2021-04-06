package testhelpers

import (
	"github.com/portainer/liblicense"
	portainer "github.com/portainer/portainer/api"
)

type Licenseservice struct{}

func (l Licenseservice) Init() error                                      { return nil }
func (l Licenseservice) Info() *portainer.LicenseInfo                     { return nil }
func (l Licenseservice) Licenses() ([]liblicense.PortainerLicense, error) { return nil, nil }
func (l Licenseservice) AddLicense(licenseKey string) (*liblicense.PortainerLicense, error) {
	return nil, nil
}
func (l Licenseservice) DeleteLicense(licenseKey string) error { return nil }
