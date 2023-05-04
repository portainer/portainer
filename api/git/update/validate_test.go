package update

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func Test_ValidateAutoUpdate(t *testing.T) {
	tests := []struct {
		name    string
		value   *portainer.AutoUpdateSettings
		wantErr bool
	}{
		{
			name:    "webhook is not a valid UUID",
			value:   &portainer.AutoUpdateSettings{Webhook: "fake-webhook"},
			wantErr: true,
		},
		{
			name:    "incorrect interval value",
			value:   &portainer.AutoUpdateSettings{Interval: "1dd2hh3mm"},
			wantErr: true,
		},
		{
			name: "valid auto update",
			value: &portainer.AutoUpdateSettings{
				Webhook:  "8dce8c2f-9ca1-482b-ad20-271e86536ada",
				Interval: "5h30m40s10ms",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateAutoUpdateSettings(tt.value)
			assert.Equalf(t, tt.wantErr, err != nil, "received %+v", err)
		})
	}
}
