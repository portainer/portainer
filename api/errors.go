package portainer

// Team errors.
const (
	ErrTeamAlreadyExists = Error("Team already exists")
)

// TeamMembership errors.
const (
	ErrTeamMembershipAlreadyExists = Error("Team membership already exists for this user and team")
)

// ResourceControl errors.
const (
	ErrResourceControlAlreadyExists = Error("A resource control is already applied on this resource")
	ErrInvalidResourceControlType   = Error("Unsupported resource control type")
)

// Endpoint errors.
const (
	ErrEndpointAccessDenied = Error("Access denied to endpoint")
)

// Azure environment errors
const (
	ErrAzureInvalidCredentials = Error("Invalid Azure credentials")
)

// Endpoint group errors.
const (
	ErrCannotRemoveDefaultGroup = Error("Cannot remove the default endpoint group")
)

// Registry errors.
const (
	ErrRegistryAlreadyExists = Error("A registry is already defined for this URL")
)

// Stack errors
const (
	ErrStackAlreadyExists              = Error("A stack already exists with this name")
	ErrComposeFileNotFoundInRepository = Error("Unable to find a Compose file in the repository")
	ErrStackNotExternal                = Error("Not an external stack")
)

// Tag errors
const (
	ErrTagAlreadyExists = Error("A tag already exists with this name")
)

// Endpoint extensions error
const (
	ErrEndpointExtensionNotSupported = Error("This extension is not supported")
)

// JWT errors.
const (
	ErrSecretGeneration = Error("Unable to generate secret key")
	ErrInvalidJWTToken  = Error("Invalid JWT token")
)

// File errors.
const (
	ErrUndefinedTLSFileType = Error("Undefined TLS file type")
)

// Extension errors.
const (
	ErrExtensionAlreadyEnabled = Error("This extension is already enabled")
)

// Docker errors.
const (
	ErrUnableToPingEndpoint = Error("Unable to communicate with the endpoint")
)

// Schedule errors.
const (
	ErrHostManagementFeaturesDisabled = Error("Host management features are disabled")
)

// Error represents an application error.
type Error string

// Error returns the error message.
func (e Error) Error() string { return string(e) }

// Webhook errors
const (
	ErrWebhookAlreadyExists   = Error("A webhook for this resource already exists")
	ErrUnsupportedWebhookType = Error("Webhooks for this resource are not currently supported")
)
