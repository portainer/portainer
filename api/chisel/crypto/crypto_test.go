package crypto

import (
	"reflect"
	"testing"
)

func TestGenerateGo119CompatibleKey(t *testing.T) {
	type args struct {
		seed string
	}
	tests := []struct {
		name    string
		args    args
		want    []byte
		wantErr bool
	}{
		{
			name:    "Generate Go 1.19 compatible private key with a given seed",
			args:    args{seed: "94qh17MCIk8BOkiI"},
			want:    []byte("-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIHeohwk0Gy3RHVVViaHz7pz/HOiqA7fkv1FTM3mGgfT3oAoGCCqGSM49\nAwEHoUQDQgAEN7riX06xDsLNPuUmOvYFluNEakcFwZZRVvOcIYk/9VYnanDzW0Km\n8/BUUiKyJDuuGdS4fj9SlQ4iL8yBK01uKg==\n-----END EC PRIVATE KEY-----\n"),
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GenerateGo119CompatibleKey(tt.args.seed)
			if (err != nil) != tt.wantErr {
				t.Errorf("GenerateGo119CompatibleKey() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("GenerateGo119CompatibleKey()\ngot: Z %v\nwant: %v", got, tt.want)
			}
		})
	}
}
