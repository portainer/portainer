package passwordutils

import "testing"

func TestStrengthCheck(t *testing.T) {
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
			if gotStrong := StrengthCheck(tt.args.password); gotStrong != tt.wantStrong {
				t.Errorf("StrengthCheck() = %v, want %v", gotStrong, tt.wantStrong)
			}
		})
	}
}
