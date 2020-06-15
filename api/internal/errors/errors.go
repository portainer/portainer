package errors

// General errors.
const (
	ErrUnauthorized           = "Unauthorized"
	ErrResourceAccessDenied   = "Access denied to resource"
	ErrAuthorizationRequired  = "Authorization required for this operation"
	ErrObjectNotFound         = "Object not found inside the database"
	ErrMissingSecurityContext = "Unable to find security details in request context"
)

// User errors.
const (
	ErrUserAlreadyExists          = "User already exists"
	ErrInvalidUsername            = "Invalid username. White spaces are not allowed"
	ErrAdminAlreadyInitialized    = "An administrator user already exists"
	ErrAdminCannotRemoveSelf      = "Cannot remove your own user account. Contact another administrator"
	ErrCannotRemoveLastLocalAdmin = "Cannot remove the last local administrator account"
)

// Team errors.
const (
	ErrTeamAlreadyExists = "Team already exists"
)

// TeamMembership errors.
const (
	ErrTeamMembershipAlreadyExists = "Team membership already exists for this user and team"
)

// ResourceControl errors.
const (
	ErrResourceControlAlreadyExists = "A resource control is already applied on this resource"
	ErrInvalidResourceControlType   = "Unsupported resource control type"
)

// Endpoint errors.
const (
	ErrEndpointAccessDenied = "Access denied to endpoint"
)

// Azure environment errors
const (
	ErrAzureInvalidCredentials = "Invalid Azure credentials"
)

// Endpoint group errors.
const (
	ErrCannotRemoveDefaultGroup = "Cannot remove the default endpoint group"
)

// Registry errors.
const (
	ErrRegistryAlreadyExists = "A registry is already defined for this URL"
)

// Stack errors
const (
	ErrStackAlreadyExists              = "A stack already exists with this name"
	ErrComposeFileNotFoundInRepository = "Unable to find a Compose file in the repository"
	ErrStackNotExternal                = "Not an external stack"
)

// Tag errors
const (
	ErrTagAlreadyExists = "A tag already exists with this name"
)

// Endpoint extensions error
const (
	ErrEndpointExtensionNotSupported      = "This extension is not supported"
	ErrEndpointExtensionAlreadyAssociated = "This extension is already associated to the endpoint"
)

// Crypto errors.
const (
	ErrCryptoHashFailure = "Unable to hash data"
)

// JWT errors.
const (
	ErrSecretGeneration   = "Unable to generate secret key"
	ErrInvalidJWTToken    = "Invalid JWT token"
	ErrMissingContextData = "Unable to find JWT data in request context"
)

// File errors.
const (
	ErrUndefinedTLSFileType = "Undefined TLS file type"
)

// Extension errors.
const (
	ErrExtensionAlreadyEnabled = "This extension is already enabled"
)

// Docker errors.
const (
	ErrUnableToPingEndpoint = "Unable to communicate with the endpoint"
)

// Schedule errors.
const (
	ErrHostManagementFeaturesDisabled = "Host management features are disabled"
)

// Webhook errors
const (
	ErrWebhookAlreadyExists   = "A webhook for this resource already exists"
	ErrUnsupportedWebhookType = "Webhooks for this resource are not currently supported"
)
