package password

import (
	"reflect"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

func TestGeneratePassword(t *testing.T) {
	type args struct {
		cryptoService portainer.CryptoService
		fileService   portainer.FileService
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GeneratePassword(tt.args.cryptoService, tt.args.fileService)
			if (err != nil) != tt.wantErr {
				t.Errorf("GeneratePassword() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("GeneratePassword() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_service_getHashFromPasswordFile(t *testing.T) {
	tests := []struct {
		name    string
		pw      *service
		want    string
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := tt.pw.getHashFromPasswordFile()
			if (err != nil) != tt.wantErr {
				t.Errorf("service.getHashFromPasswordFile() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("service.getHashFromPasswordFile() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_service_generatePassword(t *testing.T) {
	tests := []struct {
		name    string
		pw      *service
		want    string
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := tt.pw.generatePassword()
			if (err != nil) != tt.wantErr {
				t.Errorf("service.generatePassword() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("service.generatePassword() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_service_savePassword(t *testing.T) {
	type args struct {
		pwd string
	}
	tests := []struct {
		name    string
		pw      *service
		args    args
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := tt.pw.savePassword(tt.args.pwd); (err != nil) != tt.wantErr {
				t.Errorf("service.savePassword() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func Test_service_loadPassword(t *testing.T) {
	tests := []struct {
		name    string
		pw      *service
		want    []byte
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := tt.pw.loadPassword()
			if (err != nil) != tt.wantErr {
				t.Errorf("service.loadPassword() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("service.loadPassword() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_service_checkPasswordFile(t *testing.T) {
	tests := []struct {
		name string
		pw   *service
		want bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.pw.checkPasswordFile(); got != tt.want {
				t.Errorf("service.checkPasswordFile() = %v, want %v", got, tt.want)
			}
		})
	}
}
