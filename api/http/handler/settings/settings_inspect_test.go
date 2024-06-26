package settings

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func TestHandler_settingsInspect(t *testing.T) {
	t.Run("check that /api/settings returns the right value for admin", func(t *testing.T) {

		user := portainer.User{
			ID:       1,
			Username: "admin",
			Role:     portainer.AdministratorRole,
		}

		settings := &portainer.Settings{
			LogoURL:              "https://nondefault.com/logo.png",
			BlackListedLabels:    []portainer.Pair{{Name: "customlabel1", Value: "customvalue1"}},
			AuthenticationMethod: 2,
			InternalAuthSettings: portainer.InternalAuthSettings{
				RequiredPasswordLength: 10,
			},
			LDAPSettings: portainer.LDAPSettings{
				AnonymousMode: true,
				ReaderDN:      "readerDN",
				Password:      "password",
				TLSConfig: portainer.TLSConfiguration{
					TLS:           true,
					TLSSkipVerify: true,
					TLSCACertPath: "/path/to/ca-cert",
					TLSCertPath:   "/path/to/cert",
					TLSKeyPath:    "/path/to/key",
				},
				StartTLS: true,
				SearchSettings: []portainer.LDAPSearchSettings{{
					BaseDN:            "baseDN",
					Filter:            "filter",
					UserNameAttribute: "username",
				}},
				GroupSearchSettings: []portainer.LDAPGroupSearchSettings{{
					GroupBaseDN:    "groupBaseDN",
					GroupFilter:    "groupFilter",
					GroupAttribute: "groupAttribute",
				}},
				AutoCreateUsers: true,
				URL:             "ldap://admin.example.com",
			},
			OAuthSettings: portainer.OAuthSettings{
				ClientID:             "clientID",
				ClientSecret:         "clientSecret",
				AccessTokenURI:       "https://access-token-uri",
				AuthorizationURI:     "https://authorization-uri",
				ResourceURI:          "https://resource-uri",
				RedirectURI:          "https://redirect-uri",
				UserIdentifier:       "userIdentifier",
				Scopes:               "scope1 scope2",
				OAuthAutoCreateUsers: true,
				DefaultTeamID:        1,
				SSO:                  true,
				LogoutURI:            "https://logout-uri",
				KubeSecretKey:        []byte("secretKey"),
				AuthStyle:            1,
			},
			OpenAMTConfiguration: portainer.OpenAMTConfiguration{
				Enabled:          true,
				MPSServer:        "mps-server",
				MPSUser:          "mps-user",
				MPSPassword:      "mps-password",
				MPSToken:         "mps-token",
				CertFileName:     "cert-filename",
				CertFileContent:  "cert-file-content",
				CertFilePassword: "cert-file-password",
				DomainName:       "domain-name",
			},
			FDOConfiguration: portainer.FDOConfiguration{
				Enabled:       true,
				OwnerURL:      "https://owner-url",
				OwnerUsername: "owner-username",
				OwnerPassword: "owner-password",
			},
			SnapshotInterval: "30m",
			TemplatesURL:     "https://nondefault.com/templates",
			GlobalDeploymentOptions: portainer.GlobalDeploymentOptions{
				HideStacksFunctionality: true,
			},
			EnableEdgeComputeFeatures: true,
			UserSessionTimeout:        "1h",
			KubeconfigExpiry:          "48h",
			EnableTelemetry:           true,
			HelmRepositoryURL:         "https://nondefault.com/helm",
			KubectlShellImage:         "portainer/kubectl-shell:v2.0.0",
			TrustOnFirstConnect:       true,
			EnforceEdgeID:             true,
			AgentSecret:               "nondefaultsecret",
			EdgePortainerURL:          "https://edge.nondefault.com",
			EdgeAgentCheckinInterval:  20,
			Edge: portainer.EdgeSettings{
				CommandInterval:  10,
				PingInterval:     10,
				SnapshotInterval: 10,
			},
		}

		// copy settings so we can compare later (since we will change the settings struct in the handler)
		dbSettings, err := cloneMyStruct(settings)
		assert.NoError(t, err)

		dataStore := testhelpers.NewDatastore(
			testhelpers.WithSettingsService(dbSettings),
			testhelpers.WithUsers([]portainer.User{user}),
		)

		handler := &Handler{
			DataStore: dataStore,
		}

		// Create a mock request
		req, err := http.NewRequest("GET", "/settings", nil)
		assert.NoError(t, err)

		ctx := security.StoreTokenData(req, &portainer.TokenData{ID: user.ID, Username: user.Username, Role: user.Role})
		req = req.WithContext(ctx)

		restrictedCtx := security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{UserID: user.ID, IsAdmin: user.Role == portainer.AdministratorRole})
		req = req.WithContext(restrictedCtx)

		// Create a mock response recorder
		rr := httptest.NewRecorder()
		// Call the handler function
		err = handler.settingsInspect(rr, req)

		// Check for any handler errors
		assert.Nil(t, err)

		// Check the response status code
		assert.Equal(t, http.StatusOK, rr.Code)

		hideFields(settings)

		actualSettings := &portainer.Settings{}
		err = json.Unmarshal(rr.Body.Bytes(), actualSettings)
		assert.NoError(t, err)

		assert.EqualExportedValues(t, settings, actualSettings)
	})
}

func cloneMyStruct[T any](orig *T) (*T, error) {
	origJSON, err := json.Marshal(orig)
	if err != nil {
		return nil, err
	}

	clone := new(T)
	if err = json.Unmarshal(origJSON, clone); err != nil {
		return nil, err
	}

	return clone, nil
}
