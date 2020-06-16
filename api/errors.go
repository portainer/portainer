package portainer

// Error represents an application error.
type Error string

// Error returns the error message.
func (e Error) Error() string { return string(e) }
