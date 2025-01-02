package jwt

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"

	"github.com/golang-jwt/jwt/v4"
	"github.com/stretchr/testify/assert"
)

func TestService_GenerateTokenForKubeconfig(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)

	err := store.User().Create(&portainer.User{ID: 1})
	assert.NoError(t, err)

	type fields struct {
		userSessionTimeout string
		dataStore          dataservices.DataStore
	}

	type args struct {
		data *portainer.TokenData
	}

	settings, err := store.Settings().Settings()
	assert.NoError(t, err)

	settings.KubeconfigExpiry = "0"

	err = store.Settings().UpdateSettings(settings)
	assert.NoError(t, err)

	myFields := fields{
		userSessionTimeout: "24h",
		dataStore:          store,
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
		wantExpiresAt *jwt.NumericDate
		wantErr       bool
	}{
		{
			name:          "kubeconfig no expiry",
			fields:        myFields,
			args:          myArgs,
			wantExpiresAt: nil,
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

			_, _, _, err = service.ParseAndVerifyToken(got)
			assert.NoError(t, err)

			parsedToken, err := jwt.ParseWithClaims(got, &claims{}, func(token *jwt.Token) (any, error) {
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
