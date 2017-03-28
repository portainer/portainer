// +build !windows

package cli

const (
	defaultBindAddress     = ":9000"
	defaultDataDirectory   = "/data"
	defaultAssetsDirectory = "."
	defaultTemplatesURL    = "https://raw.githubusercontent.com/portainer/templates/master/templates.json"
	defaultNoAuth          = "false"
	defaultNoAnalytics     = "false"
	defaultTLSVerify       = "false"
	defaultTLSCACertPath   = "/certs/ca.pem"
	defaultTLSCertPath     = "/certs/cert.pem"
	defaultTLSKeyPath      = "/certs/key.pem"
	defaultSyncInterval    = "60s"
)
