package validate

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
)

func TestValidateLDAPSettings(t *testing.T) {

	tests := []struct {
		name    string
		ldap    portainer.LDAPSettings
		wantErr bool
	}{
		{
			name:    "Empty LDAP Settings",
			ldap:    portainer.LDAPSettings{},
			wantErr: true,
		},
		{
			name: "With URL",
			ldap: portainer.LDAPSettings{
				AnonymousMode: true,
				URL:           "192.168.0.1:323",
			},
			wantErr: false,
		},
		{
			name: "Validate URL and URLs",
			ldap: portainer.LDAPSettings{
				AnonymousMode: true,
				URL:           "192.168.0.1:323",
			},
			wantErr: false,
		},
		{
			name: "validate client ldap",
			ldap: portainer.LDAPSettings{
				AnonymousMode: false,
				ReaderDN:      "CN=LDAP API Service Account",
				Password:      "Qu**dfUUU**",
				URL:           "aukdc15.pgc.co:389",
				TLSConfig: portainer.TLSConfiguration{
					TLS:           false,
					TLSSkipVerify: false,
				},
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateLDAPSettings(&tt.ldap)
			if (err == nil) == tt.wantErr {
				t.Errorf("No error expected but got %s", err)
			}
		})
	}
}
