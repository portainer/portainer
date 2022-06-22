package security

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
)

func TestStrengthCheck(t *testing.T) {
	checker := NewPasswordStrengthChecker(settingsStub{minLength: 12})

	type args struct {
		password string
	}
	tests := []struct {
		name       string
		args       args
		wantStrong bool
	}{
		{"Empty password", args{""}, false},
		{"Short password", args{"portainer"}, false},
		{"Short password", args{"portaienr!@#"}, true},
		{"Week password", args{"12345678!@#"}, false},
		{"Week password", args{"portaienr123"}, true},
		{"Good password", args{"Portainer123"}, true},
		{"Good password", args{"Portainer___"}, true},
		{"Good password", args{"^portainer12"}, true},
		{"Good password", args{"12%PORTAINER"}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if gotStrong := checker.Check(tt.args.password); gotStrong != tt.wantStrong {
				t.Errorf("StrengthCheck() = %v, want %v", gotStrong, tt.wantStrong)
			}
		})
	}
}

type settingsStub struct {
	minLength int
}

func (s settingsStub) Settings() (*portainer.Settings, error) {
	return &portainer.Settings{
		InternalAuthSettings: portainer.InternalAuthSettings{
			RequiredPasswordLength: s.minLength,
		},
	}, nil
}
