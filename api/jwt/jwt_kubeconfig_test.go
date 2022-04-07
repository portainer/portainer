package jwt

import (
	"testing"

	"github.com/golang-jwt/jwt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	i "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func TestService_GenerateTokenForKubeconfig(t *testing.T) {
	type fields struct {
		userSessionTimeout string
		dataStore          dataservices.DataStore
	}

	type args struct {
		data *portainer.TokenData
	}

	mySettings := &portainer.Settings{
		KubeconfigExpiry: "0",
	}

	myFields := fields{
		userSessionTimeout: "24h",
		dataStore:          i.NewDatastore(i.WithSettingsService(mySettings)),
	}

	myTokenData := &portainer.TokenData{
		Username: "Joe",
		ID:       1,
		Role:     1,
	}

	myArgs := args{
		data: myTokenData,
	}

	tests := []struct {
		name          string
		fields        fields
		args          args
		wantExpiresAt int64
		wantErr       bool
	}{
		{
			name:          "kubeconfig no expiry",
			fields:        myFields,
			args:          myArgs,
			wantExpiresAt: 0,
			wantErr:       false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service, err := NewService(tt.fields.userSessionTimeout, tt.fields.dataStore)
			assert.NoError(t, err, "failed to create a copy of service")

			got, err := service.GenerateTokenForKubeconfig(tt.args.data)
			if (err != nil) != tt.wantErr {
				t.Errorf("GenerateTokenForKubeconfig() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			parsedToken, err := jwt.ParseWithClaims(got, &claims{}, func(token *jwt.Token) (interface{}, error) {
				return service.secrets[kubeConfigScope], nil
			})
			assert.NoError(t, err, "failed to parse generated token")

			tokenClaims, ok := parsedToken.Claims.(*claims)
			assert.Equal(t, true, ok, "failed to claims out of generated ticket")

			assert.Equal(t, myTokenData.Username, tokenClaims.Username)
			assert.Equal(t, int(myTokenData.ID), tokenClaims.UserID)
			assert.Equal(t, int(myTokenData.Role), tokenClaims.Role)
			assert.Equal(t, tt.wantExpiresAt, tokenClaims.ExpiresAt)
		})
	}
}
