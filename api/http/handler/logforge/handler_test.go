package logforge

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/stretchr/testify/require"
)

func TestStatusWithoutSettings(t *testing.T) {
	handler := newTestHandler(t)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/logforge/status", nil)

	handler.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)

	var status statusResponse
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &status))
	require.False(t, status.Enabled)
	require.Equal(t, browserProxyPath, status.BrowserProxyPath)
	require.Equal(t, "not_configured", status.Health.Status)
	require.False(t, status.Access.Allowed)
	require.NotContains(t, recorder.Body.String(), `"ServiceKey":`)
}

func TestInstallRegistersExternalAppliance(t *testing.T) {
	var healthServiceKey string
	var healthHost string
	healthServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/unicron/api/health", r.URL.Path)
		healthServiceKey = r.Header.Get(serviceKeyHeader)
		healthHost = r.Host

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","version":"0.1.0"}`))
	}))
	t.Cleanup(healthServer.Close)

	handler := newTestHandler(t)
	handler.httpClient = healthServer.Client()

	payload := []byte(`{"ApplianceUrl":"` + healthServer.URL + `/unicron/","ApplianceHostHeader":"logforge.example.test"}`)
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/logforge/install", bytes.NewReader(payload))
	request.Header.Set("Content-Type", "application/json")

	handler.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusCreated, recorder.Code)

	var status statusResponse
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &status))
	require.True(t, status.Enabled)
	require.False(t, status.Managed)
	require.Equal(t, healthServer.URL+"/unicron", status.ApplianceURL)
	require.Equal(t, "instance-1", status.PortainerInstanceID)
	require.Equal(t, "healthy", status.Health.Status)
	require.Equal(t, "0.1.0", status.Health.Version)
	require.Equal(t, "logforge.example.test", status.ApplianceHostHeader)
	require.True(t, status.ManagedAuthReady)
	require.NotEmpty(t, status.ServiceKeyPrefix)
	require.NotContains(t, recorder.Body.String(), `"ServiceKey":`)

	settings, err := handler.DataStore.LogForge().Settings()
	require.NoError(t, err)
	require.NotEmpty(t, settings.ServiceKey)
	require.Equal(t, settings.ServiceKey, healthServiceKey)
	require.Equal(t, "logforge.example.test", healthHost)
	require.Equal(t, status.ServiceKeyPrefix, settings.ServiceKeyPrefix)
}

func TestUIProxyInjectsServiceKeyAndRewritesUnicronPaths(t *testing.T) {
	var upstreamServiceKey string
	var upstreamAuthorization string
	var upstreamCookie string
	var upstreamAcceptEncoding string
	var upstreamHost string
	var upstreamManagedBy string
	var upstreamManagedIdentity string
	var upstreamManagedSignature string
	var upstreamOrigin string
	var upstreamReferer string
	var upstreamForwardedProto string
	var upstreamForwardedHost string

	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/unicron/assets/app.js", r.URL.Path)
		upstreamServiceKey = r.Header.Get(serviceKeyHeader)
		upstreamAuthorization = r.Header.Get("Authorization")
		upstreamCookie = r.Header.Get("Cookie")
		upstreamAcceptEncoding = r.Header.Get("Accept-Encoding")
		upstreamHost = r.Host
		upstreamManagedBy = r.Header.Get(managedByHeader)
		upstreamManagedIdentity = r.Header.Get(managedIdentityHeader)
		upstreamManagedSignature = r.Header.Get(managedSignatureHeader)
		upstreamOrigin = r.Header.Get("Origin")
		upstreamReferer = r.Header.Get("Referer")
		upstreamForwardedProto = r.Header.Get("X-Forwarded-Proto")
		upstreamForwardedHost = r.Header.Get("X-Forwarded-Host")

		w.Header().Set("Content-Type", "application/javascript")
		_, _ = w.Write([]byte(`window.fetch("/unicron/api/logs");`))
	}))
	t.Cleanup(upstream.Close)

	handler := newTestHandler(t)
	require.NoError(t, handler.DataStore.LogForge().UpdateSettings(&portainer.LogForgeSettings{
		Enabled:             true,
		ApplianceURL:        upstream.URL,
		ApplianceHostHeader: "logforge.example.test",
		BrowserProxyPath:    browserProxyPath,
		ServiceKey:          "secret-service-key",
	}))
	endpoint := createDockerEndpointWithUserAccess(t, handler, portainer.UserID(2), readOnlyRoleID)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/logforge/ui/assets/app.js", nil)
	request.Header.Set("Authorization", "Bearer browser-token")
	request.Header.Set("Cookie", "portainer=browser-cookie")
	request.Header.Set("Accept-Encoding", "gzip, br")
	request.Header.Set("Origin", "http://localhost:19001")
	request.Header.Set("Referer", "http://localhost:19001/#!/logforge")
	request.Header.Set(serviceKeyHeader, "browser-supplied-key")
	request.Header.Set(managedByHeader, "browser")
	request.Header.Set(managedIdentityHeader, "browser-identity")
	request.Header.Set(managedSignatureHeader, "browser-signature")
	request = withLogForgeUser(request, &portainer.TokenData{
		ID:       2,
		Username: "alice",
		Role:     portainer.StandardUserRole,
	}, &security.RestrictedRequestContext{UserID: 2})

	handler.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Equal(t, "secret-service-key", upstreamServiceKey)
	require.Equal(t, "logforge.example.test", upstreamHost)
	require.Empty(t, upstreamAuthorization)
	require.Empty(t, upstreamCookie)
	require.Equal(t, "identity", upstreamAcceptEncoding)
	require.Equal(t, "portainer", upstreamManagedBy)
	require.NotEmpty(t, upstreamManagedIdentity)
	require.NotEmpty(t, upstreamManagedSignature)
	require.Equal(t, "http://logforge.example.test", upstreamOrigin)
	require.Equal(t, "http://logforge.example.test/", upstreamReferer)
	require.Equal(t, "http", upstreamForwardedProto)
	require.Equal(t, "logforge.example.test", upstreamForwardedHost)
	require.Contains(t, recorder.Body.String(), `"/logforge/ui/api/logs"`)
	require.NotContains(t, recorder.Body.String(), `"/unicron/api/logs"`)

	payload, err := base64.RawURLEncoding.DecodeString(upstreamManagedIdentity)
	require.NoError(t, err)
	signature, err := base64.RawURLEncoding.DecodeString(upstreamManagedSignature)
	require.NoError(t, err)
	mac := hmac.New(sha256.New, []byte("secret-service-key"))
	_, _ = mac.Write([]byte(upstreamManagedIdentity))
	require.True(t, hmac.Equal(mac.Sum(nil), signature))

	var claims managedIdentityClaims
	require.NoError(t, json.Unmarshal(payload, &claims))
	require.Equal(t, "portainer", claims.Issuer)
	require.Equal(t, "portainer:user:2", claims.Subject)
	require.Equal(t, portainer.UserID(2), claims.UserID)
	require.Equal(t, "alice", claims.Username)
	require.False(t, claims.IsAdmin)
	require.Len(t, claims.Endpoints, 1)
	require.Equal(t, endpoint.ID, claims.Endpoints[0].ID)
	require.Equal(t, endpoint.Name, claims.Endpoints[0].Name)
	require.Equal(t, "read_only", claims.Endpoints[0].Role)
	require.Equal(t, readOnlyRoleID, claims.Endpoints[0].RoleID)
	require.Greater(t, claims.ExpiresAt, claims.IssuedAt)
	require.Contains(t, string(payload), `"id":`)
	require.Contains(t, string(payload), `"role_id":`)
	require.NotContains(t, string(payload), `"Id":`)
	require.NotContains(t, string(payload), `"RoleId":`)
}

func TestUIProxyRejectsUsersWithoutDockerEndpointAccess(t *testing.T) {
	upstream := httptest.NewServer(http.NotFoundHandler())
	t.Cleanup(upstream.Close)

	handler := newTestHandler(t)
	require.NoError(t, handler.DataStore.LogForge().UpdateSettings(&portainer.LogForgeSettings{
		Enabled:          true,
		ApplianceURL:     upstream.URL,
		BrowserProxyPath: browserProxyPath,
		ServiceKey:       "secret-service-key",
	}))

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/logforge/ui/", nil)
	request = withLogForgeUser(request, &portainer.TokenData{
		ID:       2,
		Username: "alice",
		Role:     portainer.StandardUserRole,
	}, &security.RestrictedRequestContext{UserID: 2})

	handler.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusForbidden, recorder.Code)
}

func TestUIProxyRewritesManifestDiscoveryPaths(t *testing.T) {
	var upstreamPaths string
	var upstreamVersion string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/unicron/__manifest", r.URL.Path)
		upstreamPaths = r.URL.Query().Get("paths")
		upstreamVersion = r.URL.Query().Get("version")

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"routes/alerting/_layout":{"path":"alerting"}}`))
	}))
	t.Cleanup(upstream.Close)

	handler := newTestHandler(t)
	require.NoError(t, handler.DataStore.LogForge().UpdateSettings(&portainer.LogForgeSettings{
		Enabled:          true,
		ApplianceURL:     upstream.URL,
		BrowserProxyPath: browserProxyPath,
		ServiceKey:       "secret-service-key",
	}))
	createDockerEndpointWithUserAccess(t, handler, portainer.UserID(2), readOnlyRoleID)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/logforge/ui/__manifest?paths=%2Flogforge%2Fui%2Falerting%2C%2Flogforge%2Fui%2Fnotifications&version=route-version", nil)
	request = withLogForgeUser(request, &portainer.TokenData{
		ID:       2,
		Username: "alice",
		Role:     portainer.StandardUserRole,
	}, &security.RestrictedRequestContext{UserID: 2})

	handler.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Equal(t, "/unicron/alerting,/unicron/notifications", upstreamPaths)
	require.Equal(t, "route-version", upstreamVersion)
	require.Contains(t, recorder.Body.String(), `"path":"alerting"`)
}

func TestStatusIncludesLogForgeAccessScopes(t *testing.T) {
	handler := newTestHandler(t)
	endpoint := createDockerEndpointWithUserAccess(t, handler, portainer.UserID(2), operatorRoleID)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/logforge/status", nil)
	request = withLogForgeUser(request, &portainer.TokenData{
		ID:       2,
		Username: "alice",
		Role:     portainer.StandardUserRole,
	}, &security.RestrictedRequestContext{UserID: 2})

	handler.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)

	var status statusResponse
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &status))
	require.True(t, status.Access.Allowed)
	require.False(t, status.Access.IsAdmin)
	require.Equal(t, portainer.UserID(2), status.Access.UserID)
	require.Equal(t, "alice", status.Access.Username)
	require.Len(t, status.Access.Endpoints, 1)
	require.Equal(t, endpoint.ID, status.Access.Endpoints[0].ID)
	require.Equal(t, "read_only", status.Access.Endpoints[0].Role)
	require.Equal(t, readOnlyRoleID, status.Access.Endpoints[0].RoleID)
}

func TestStatusSanitizesNonAdminEndpointRolesToReadOnly(t *testing.T) {
	testCases := []struct {
		name   string
		roleID portainer.RoleID
	}{
		{name: "standard", roleID: standardRoleID},
		{name: "endpoint-admin", roleID: endpointAdminRoleID},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			handler := newTestHandler(t)
			endpoint := createDockerEndpointWithUserAccess(t, handler, portainer.UserID(2), tc.roleID)

			recorder := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodGet, "/logforge/status", nil)
			request = withLogForgeUser(request, &portainer.TokenData{
				ID:       2,
				Username: "alice",
				Role:     portainer.StandardUserRole,
			}, &security.RestrictedRequestContext{UserID: 2})

			handler.ServeHTTP(recorder, request)

			require.Equal(t, http.StatusOK, recorder.Code)

			var status statusResponse
			require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &status))
			require.True(t, status.Access.Allowed)
			require.False(t, status.Access.IsAdmin)
			require.Len(t, status.Access.Endpoints, 1)
			require.Equal(t, endpoint.ID, status.Access.Endpoints[0].ID)
			require.Equal(t, "read_only", status.Access.Endpoints[0].Role)
			require.Equal(t, readOnlyRoleID, status.Access.Endpoints[0].RoleID)
		})
	}
}

func TestStatusIncludesAdminScopeForPortainerAdministrators(t *testing.T) {
	handler := newTestHandler(t)
	endpoint := createDockerEndpointWithUserAccess(t, handler, portainer.UserID(2), readOnlyRoleID)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/logforge/status", nil)
	request = withLogForgeUser(request, &portainer.TokenData{
		ID:       1,
		Username: "admin",
		Role:     portainer.AdministratorRole,
	}, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})

	handler.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)

	var status statusResponse
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &status))
	require.True(t, status.Access.Allowed)
	require.True(t, status.Access.IsAdmin)
	require.Len(t, status.Access.Endpoints, 1)
	require.Equal(t, endpoint.ID, status.Access.Endpoints[0].ID)
	require.Equal(t, "admin", status.Access.Endpoints[0].Role)
	require.Equal(t, endpointAdminRoleID, status.Access.Endpoints[0].RoleID)
}

func TestManagedComposeUsesPortainerManagedMode(t *testing.T) {
	compose := renderManagedCompose(
		&installPayload{
			Image:            "example/unicron:test",
			CentralFQDN:      "logs.example.test",
			HTTPSPort:        9449,
			MTLSPort:         8450,
			RemoteAgentImage: "example/unicron-agent:test",
		},
		"custom-logforge",
		"instance-1",
		"abcdef",
	)

	require.Contains(t, compose, "image: example/unicron:test")
	require.Contains(t, compose, "pull_policy: always")
	require.Contains(t, compose, "UNICRON_MANAGED_BY: portainer")
	require.Contains(t, compose, `UNICRON_SELF_UPDATE_ENABLED: "false"`)
	require.Contains(t, compose, `UNICRON_MANAGED_EXTERNAL_AUTH_ENABLED: "true"`)
	require.Contains(t, compose, "UNICRON_MANAGED_EXTERNAL_AUTH_PROVIDER: portainer")
	require.Contains(t, compose, "UNICRON_MANAGED_IDENTITY_HEADER: X-LogForge-Managed-Identity")
	require.Contains(t, compose, "UNICRON_MANAGED_IDENTITY_SIGNATURE_HEADER: X-LogForge-Managed-Identity-Signature")
	require.Contains(t, compose, "UNICRON_MANAGED_SERVICE_KEY_HEADER: X-LogForge-Service-Key")
	require.Contains(t, compose, "UNICRON_MANAGED_SERVICE_KEY_SHA256: abcdef")
	require.Contains(t, compose, "PORTAINER_INSTANCE_ID: instance-1")
	require.Contains(t, compose, "REMOTE_AGENT_IMAGE: example/unicron-agent:test")
	require.Contains(t, compose, "LOCAL_AGENT_DOCKER_NETWORK: custom-logforge_default")
	require.Contains(t, compose, "- unicron.central")
	require.Contains(t, compose, `"9449:443"`)
	require.Contains(t, compose, `"8450:8443"`)
	require.NotContains(t, compose, "/var/run/docker.sock")
}

func TestManagedComposeUsesPortainerIntegrationImagesByDefault(t *testing.T) {
	compose := renderManagedCompose(&installPayload{}, "logforge", "instance-1", "abcdef")

	require.Contains(t, compose, "image: logforge/unicron:portainer-integration")
	require.Contains(t, compose, "REMOTE_AGENT_IMAGE: logforge/unicron-agent:portainer-integration")
}

func TestManagedInstallDerivesHostHeaderFromCentralFQDN(t *testing.T) {
	hostHeader := applianceHostHeader(&installPayload{
		EndpointID:   1,
		ApplianceURL: "https://172.17.0.1:19444",
		CentralFQDN:  "localhost",
	})

	require.Equal(t, "localhost", hostHeader)
}

func newTestHandler(t *testing.T) *Handler {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, true)
	require.NoError(t, store.Version().UpdateInstanceID("instance-1"))

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store
	return handler
}

func createDockerEndpointWithUserAccess(t *testing.T, handler *Handler, userID portainer.UserID, roleID portainer.RoleID) portainer.Endpoint {
	t.Helper()

	group := &portainer.EndpointGroup{
		Name: "docker-group",
	}
	require.NoError(t, handler.DataStore.EndpointGroup().Create(group))

	endpoint := &portainer.Endpoint{
		ID:      portainer.EndpointID(handler.DataStore.Endpoint().GetNextIdentifier()),
		Name:    "local-docker",
		Type:    portainer.DockerEnvironment,
		GroupID: group.ID,
		UserAccessPolicies: portainer.UserAccessPolicies{
			userID: {RoleID: roleID},
		},
	}
	require.NoError(t, handler.DataStore.Endpoint().Create(endpoint))

	return *endpoint
}

func withLogForgeUser(request *http.Request, tokenData *portainer.TokenData, requestContext *security.RestrictedRequestContext) *http.Request {
	request = request.WithContext(security.StoreTokenData(request, tokenData))
	if requestContext != nil {
		request = request.WithContext(security.StoreRestrictedRequestContext(request, requestContext))
	}

	return request
}
