// +build !windows

package cli

const (
	defaultBindAddress         = ":9000"
	defaultTunnelServerAddress = "0.0.0.0"
	defaultTunnelServerPort    = "8000"
	defaultDataDirectory       = "/data"
	defaultAssetsDirectory     = "./"
	defaultNoAnalytics         = "false"
	defaultTLS                 = "false"
	defaultTLSSkipVerify       = "false"
	defaultTLSCACertPath       = "/certs/ca.pem"
	defaultTLSCertPath         = "/certs/cert.pem"
	defaultTLSKeyPath          = "/certs/key.pem"
	defaultSSL                 = "false"
	defaultSSLCertPath         = "/certs/portainer.crt"
	defaultSSLKeyPath          = "/certs/portainer.key"
	defaultSnapshotInterval    = "5m"
)
