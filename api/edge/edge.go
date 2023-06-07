package edge

type (

	// StackPayload represents the payload sent to the agent
	StackPayload struct {
		// ID of the stack
		ID int
		// Name of the stack
		Name string
		// Content of the stack file
		FileContent string
		// Namespace to use for kubernetes stack. Keep empty to use the manifest namespace.
		Namespace string
		// Version of the stack file
		Version int
		// Content of the .env file
		DotEnvFileContent string

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
