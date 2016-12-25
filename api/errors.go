package portainer

// General errors.
const (
	ErrUnauthorized = Error("Unauthorized")
)

// User errors.
const (
	ErrUserNotFound = Error("User not found")
)

// Endpoint errors.
const (
	ErrEndpointNotFound = Error("Endpoint not found")
	ErrNoActiveEndpoint = Error("Undefined Docker endpoint")
)

// Crypto errors.
const (
	ErrCryptoHashFailure = Error("Unable to hash data")
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

// Error represents an application error.
type Error string

// Error returns the error message.
func (e Error) Error() string { return string(e) }
