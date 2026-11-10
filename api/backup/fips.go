package backup

import "errors"

// ErrPasswordRequiredInFIPSMode is returned when a backup is created or restored
// without a password while fips mode is enabled. Fips mode requires every backup
// to be encrypted, so an unencrypted archive can neither be produced nor accepted.
var ErrPasswordRequiredInFIPSMode = errors.New("fips mode is enabled but no backup password was provided. Backups must be encrypted in fips mode")

// RequireEncryptionInFIPSMode reports whether a backup may be created or restored
// with the given password.
func RequireEncryptionInFIPSMode(password string, fipsMode bool) error {
	if fipsMode && password == "" {
		return ErrPasswordRequiredInFIPSMode
	}

	return nil
}
