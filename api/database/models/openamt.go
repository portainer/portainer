package models

type (
	// PowerState represents an AMT managed device power state
	PowerState int

	// OpenAMTConfiguration represents the credentials and configurations used to connect to an OpenAMT MPS server
	OpenAMTConfiguration struct {
		Enabled          bool   `json:"enabled"`
		MPSServer        string `json:"mpsServer"`
		MPSUser          string `json:"mpsUser"`
		MPSPassword      string `json:"mpsPassword"`
		MPSToken         string `json:"mpsToken"` // retrieved from API
		CertFileName     string `json:"certFileName"`
		CertFileContent  string `json:"certFileContent"`
		CertFilePassword string `json:"certFilePassword"`
		DomainName       string `json:"domainName"`
	}

	// OpenAMTDeviceInformation represents an AMT managed device information
	OpenAMTDeviceInformation struct {
		GUID             string                        `json:"guid"`
		HostName         string                        `json:"hostname"`
		ConnectionStatus bool                          `json:"connectionStatus"`
		PowerState       PowerState                    `json:"powerState"`
		EnabledFeatures  *OpenAMTDeviceEnabledFeatures `json:"features"`
	}

	// OpenAMTDeviceEnabledFeatures represents an AMT managed device features information
	OpenAMTDeviceEnabledFeatures struct {
		Redirection bool   `json:"redirection"`
		KVM         bool   `json:"KVM"`
		SOL         bool   `json:"SOL"`
		IDER        bool   `json:"IDER"`
		UserConsent string `json:"userConsent"`
	}
)
