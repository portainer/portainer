package models

type (
	// TLSConfiguration represents a TLS configuration
	TLSConfiguration struct {
		// Use TLS
		TLS bool `json:"TLS" example:"true"`
		// Skip the verification of the server TLS certificate
		TLSSkipVerify bool `json:"TLSSkipVerify" example:"false"`
		// Path to the TLS CA certificate file
		TLSCACertPath string `json:"TLSCACert,omitempty" example:"/data/tls/ca.pem"`
		// Path to the TLS client certificate file
		TLSCertPath string `json:"TLSCert,omitempty" example:"/data/tls/cert.pem"`
		// Path to the TLS client key file
		TLSKeyPath string `json:"TLSKey,omitempty" example:"/data/tls/key.pem"`
	}
)
