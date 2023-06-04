package edge

type (

	// StackPayload represents the payload sent to the agent
	StackPayload struct {
		Name        string
		FileContent string
		// Namespace to use for kubernetes stack. Keep empty to use the manifest namespace.
		Namespace string
		ID        int
		Version   int

		// Used only for EE
		RegistryCredentials []RegistryCredentials
		// Used only for EE
		PrePullImage bool
		// Used only for EE
		RePullImage bool
		// Used only for EE
		RetryDeploy bool
		// Used only for EE
		EdgeUpdateID int
	}

	// RegistryCredentials holds the credentials for a Docker registry.
	RegistryCredentials struct {
		ServerURL string
		Username  string
		Secret    string
	}
)
