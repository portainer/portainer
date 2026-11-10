package jwt

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestService_GenerateTokenForKubeconfig(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)

	err := store.User().Create(&portainer.User{ID: 1})
	require.NoError(t, err)

	type fields struct {
		userSessionTimeout string
		dataStore          dataservices.DataStore
	}

	type args struct {
		data *portainer.TokenData
	}

	settings, err := store.Settings().Settings()
	require.NoError(t, err)

	settings.KubeconfigExpiry = "0"

	err = store.Settings().UpdateSettings(settings)
	require.NoError(t, err)

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
			require.NoError(t, err, "failed to create a copy of service")

			got, err := service.GenerateTokenForKubeconfig(tt.args.data, 1)
			if (err != nil) != tt.wantErr {
				t.Errorf("GenerateTokenForKubeconfig() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			_, _, _, err = service.ParseAndVerifyToken(got)
			require.NoError(t, err)

			parsedToken, err := jwt.ParseWithClaims(got, &claims{}, func(token *jwt.Token) (any, error) {
				return service.secrets[portainer.KubeconfigTokenScope], nil
			})
			require.NoError(t, err, "failed to parse generated token")

			tokenClaims, ok := parsedToken.Claims.(*claims)
			assert.True(t, ok, "failed to claims out of generated ticket")

			assert.Equal(t, myTokenData.Username, tokenClaims.Username)
			assert.Equal(t, int(myTokenData.ID), tokenClaims.UserID)
			assert.Equal(t, int(myTokenData.Role), tokenClaims.Role)
			assert.Equal(t, tt.wantExpiresAt, tokenClaims.ExpiresAt)
		})
	}
}

// countingSettings counts how often the settings are read, so a regression that
// reads them once per environment fails here rather than in production.
type countingSettings struct {
	dataservices.SettingsService
	reads *int
}

func (s countingSettings) Settings() (*portainer.Settings, error) {
	*s.reads++

	return s.SettingsService.Settings()
}

type countingTx struct {
	dataservices.DataStoreTx
	reads *int
}

func (tx countingTx) Settings() dataservices.SettingsService {
	return countingSettings{SettingsService: tx.DataStoreTx.Settings(), reads: tx.reads}
}

type countingStore struct {
	dataservices.DataStore
	reads *int
}

func (s countingStore) ViewTx(fn func(dataservices.DataStoreTx) error) error {
	return s.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		return fn(countingTx{DataStoreTx: tx, reads: s.reads})
	})
}

func newCountingStore(t *testing.T) (dataservices.DataStore, *int) {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, false)
	require.NoError(t, store.User().Create(&portainer.User{ID: 1}))

	reads := 0

	return countingStore{DataStore: store, reads: &reads}, &reads
}

func TestGenerateTokensForKubeconfig_ReadsSettingsOnce(t *testing.T) {
	t.Parallel()
	store, reads := newCountingStore(t)

	service, err := NewService("1h", store)
	require.NoError(t, err)

	endpointIDs := make([]portainer.EndpointID, 50)
	for i := range endpointIDs {
		endpointIDs[i] = portainer.EndpointID(i + 1)
	}

	tokens, err := service.GenerateTokensForKubeconfig(&portainer.TokenData{ID: 1}, endpointIDs)
	require.NoError(t, err)

	require.Len(t, tokens, len(endpointIDs), "one token per environment")
	require.Equal(t, 1, *reads, "settings must be read once, not once per environment")

	// Each token must stay scoped to its own environment.
	for _, endpointID := range endpointIDs {
		parsed, _, _, err := service.ParseAndVerifyToken(tokens[endpointID])
		require.NoError(t, err)
		require.Equal(t, endpointID, parsed.EndpointID)
		require.Equal(t, portainer.KubeconfigTokenScope, parsed.Scope)
	}
}

func TestGenerateTokensForKubeconfig_RejectsAnUnscopedToken(t *testing.T) {
	t.Parallel()
	store, _ := newCountingStore(t)

	service, err := NewService("1h", store)
	require.NoError(t, err)

	_, err = service.GenerateTokensForKubeconfig(&portainer.TokenData{ID: 1},
		[]portainer.EndpointID{1, portainer.UnscopedToken})
	require.ErrorIs(t, err, errUnscopedKubeconfigToken)
}
