package backup

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestRequireEncryptionInFIPSMode(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		password string
		fipsMode bool
		wantErr  error
	}{
		{
			name:     "fips mode without a password is rejected",
			password: "",
			fipsMode: true,
			wantErr:  ErrPasswordRequiredInFIPSMode,
		},
		{
			name:     "fips mode with a password is allowed",
			password: "passphrase",
			fipsMode: true,
		},
		{
			name:     "non fips mode without a password is allowed",
			password: "",
			fipsMode: false,
		},
		{
			name:     "non fips mode with a password is allowed",
			password: "passphrase",
			fipsMode: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			err := RequireEncryptionInFIPSMode(tt.password, tt.fipsMode)
			if tt.wantErr == nil {
				require.NoError(t, err)
			} else {
				require.ErrorIs(t, err, tt.wantErr)
			}
		})
	}
}
