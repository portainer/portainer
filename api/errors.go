package portainer

// General errors.
const (
	ErrUnauthorized         = Error("Unauthorized")
	ErrResourceAccessDenied = Error("Access denied to resource")
)

// User errors.
const (
	ErrUserNotFound            = Error("User not found")
	ErrUserAlreadyExists       = Error("User already exists")
	ErrAdminAlreadyInitialized = Error("Admin user already initialized")
)

// Endpoint errors.
const (
	ErrEndpointNotFound     = Error("Endpoint not found")
	ErrEndpointAccessDenied = Error("Access denied to endpoint")
)

// Version errors.
const (
	ErrDBVersionNotFound = Error("DB version not found")
)

// Crypto errors.
const (
	ErrCryptoHashFailure = Error("Unable to hash data")
)

// JWT errors.
const (
	ErrSecretGeneration   = Error("Unable to generate secret key")
	ErrInvalidJWTToken    = Error("Invalid JWT token")
	ErrMissingContextData = Error("Unable to find JWT data in request context")
)

// File errors.
const (
	ErrUndefinedTLSFileType = Error("Undefined TLS file type")
)

// Demo errors.
const (
	ErrNotAvailableInDemo = Error("This feature is not available in the demo version of Portainer")
)

// Error represents an application error.
type Error string

// Error returns the error message.
func (e Error) Error() string { return string(e) }
