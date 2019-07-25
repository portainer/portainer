// +build !windows

package cli

const (
	defaultBindAddress         = ":9000"
	defaultTunnelServerAddress = "0.0.0.0"
	defaultTunnelServerPort    = "8000"
	defaultDataDirectory       = "/data"
	defaultAssetsDirectory     = "./"
	defaultNoAuth              = "false"
	defaultNoAnalytics         = "false"
	defaultTLS                 = "false"
	defaultTLSSkipVerify       = "false"
	defaultTLSCACertPath       = "/certs/ca.pem"
	defaultTLSCertPath         = "/certs/cert.pem"
	defaultTLSKeyPath          = "/certs/key.pem"
	defaultSSL                 = "false"
	defaultSSLCertPath         = "/certs/portainer.crt"
	defaultSSLKeyPath          = "/certs/portainer.key"
	defaultSyncInterval        = "60s"
	defaultSnapshot            = "true"
	defaultSnapshotInterval    = "5m"
	defaultTemplateFile        = "/templates.json"
)
