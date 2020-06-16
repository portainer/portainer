package portainer

// Endpoint errors.
const (
	ErrEndpointAccessDenied = Error("Access denied to endpoint")
)

// File errors.
const (
	ErrUndefinedTLSFileType = Error("Undefined TLS file type")
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
