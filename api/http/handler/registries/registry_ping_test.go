package registries

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"oras.land/oras-go/v2/registry/remote/errcode"
)

func Test_categorizeRegistryError(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name        string
		err         error
		registryURL string
		want        string
	}{
		{
			name:        "nil error returns empty string",
			err:         nil,
			registryURL: "registry.example.com",
			want:        "",
		},
		{
			name: "401 Unauthorized returns access token invalid message",
			err: &errcode.ErrorResponse{
				StatusCode: http.StatusUnauthorized,
			},
			registryURL: "registry-1.docker.io",
			want:        "Access token invalid: Authentication failed - please verify your username and access token",
		},
		{
			name: "403 Forbidden returns access token invalid message",
			err: &errcode.ErrorResponse{
				StatusCode: http.StatusForbidden,
			},
			registryURL: "registry-1.docker.io",
			want:        "Access token invalid: Authentication failed - please verify your username and access token",
		},
		{
			name: "500 Internal Server Error returns connection error",
			err: &errcode.ErrorResponse{
				StatusCode: http.StatusInternalServerError,
				Method:     "GET",
				URL:        &url.URL{Scheme: "https", Host: "registry-1.docker.io", Path: "/v2/"},
				Errors:     errcode.Errors{},
			},
			registryURL: "registry-1.docker.io",
			want:        "Connection error: GET \"https://registry-1.docker.io/v2/\": response status code 500: Internal Server Error",
		},
		{
			name: "404 Not Found returns connection error",
			err: &errcode.ErrorResponse{
				StatusCode: http.StatusNotFound,
				Method:     "GET",
				URL:        &url.URL{Scheme: "https", Host: "registry.example.com", Path: "/v2/"},
				Errors:     errcode.Errors{},
			},
			registryURL: "registry.example.com",
			want:        "Connection error: GET \"https://registry.example.com/v2/\": response status code 404: Not Found",
		},
		{
			name: "400 Bad Request with error details returns connection error with details",
			err: &errcode.ErrorResponse{
				StatusCode: http.StatusBadRequest,
				Method:     "GET",
				URL:        &url.URL{Scheme: "https", Host: "registry.example.com", Path: "/v2/"},
				Errors: errcode.Errors{
					{
						Code:    errcode.ErrorCodeNameInvalid,
						Message: "invalid repository name",
					},
				},
			},
			registryURL: "registry.example.com",
			want:        "Connection error: GET \"https://registry.example.com/v2/\": response status code 400: name invalid: invalid repository name",
		},
		{
			name:        "non-errcode error returns connection error",
			err:         errors.New("dial tcp: lookup registry.example.com: no such host"),
			registryURL: "registry.example.com",
			want:        "Connection error: dial tcp: lookup registry.example.com: no such host",
		},
		{
			name:        "network timeout error returns connection error",
			err:         errors.New("context deadline exceeded"),
			registryURL: "registry.example.com",
			want:        "Connection error: context deadline exceeded",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := categorizeRegistryError(tt.err, tt.registryURL)
			assert.Equal(t, tt.want, got)
		})
	}
}

func Test_registryPingPayload_Validate(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name    string
		payload registryPingPayload
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid DockerHub payload",
			payload: registryPingPayload{
				Type:     6, // DockerHub
				URL:      "registry-1.docker.io",
				Username: "testuser",
				Password: "testpass",
			},
			wantErr: false,
		},
		{
			name: "valid custom registry payload",
			payload: registryPingPayload{
				Type:     3, // Custom
				URL:      "registry.example.com",
				Username: "admin",
				Password: "secret",
				TLS:      true,
			},
			wantErr: false,
		},
		{
			name: "empty username returns error",
			payload: registryPingPayload{
				Type:     6,
				URL:      "registry-1.docker.io",
				Username: "",
				Password: "testpass",
			},
			wantErr: true,
			errMsg:  "Username and password are required",
		},
		{
			name: "empty password returns error",
			payload: registryPingPayload{
				Type:     6,
				URL:      "registry-1.docker.io",
				Username: "testuser",
				Password: "",
			},
			wantErr: true,
			errMsg:  "Username and password are required",
		},
		{
			name: "invalid registry type returns error",
			payload: registryPingPayload{
				Type:     99, // Invalid type
				URL:      "registry-1.docker.io",
				Username: "testuser",
				Password: "testpass",
			},
			wantErr: true,
			errMsg:  "Invalid registry type",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.payload.Validate(nil)
			if tt.wantErr {
				require.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestHandler_pingRegistry(t *testing.T) {
	t.Parallel()

	handler, _ := newTestHandler(t)

	tests := []struct {
		name           string
		payload        registryPingPayload
		wantStatusCode int
		wantSuccess    bool
		checkResponse  func(t *testing.T, resp registryPingResponse)
	}{
		{
			name: "invalid payload - empty username",
			payload: registryPingPayload{
				Type:     portainer.DockerHubRegistry,
				URL:      "registry-1.docker.io",
				Username: "",
				Password: "testpass",
			},
			wantStatusCode: http.StatusBadRequest,
		},
		{
			name: "invalid payload - empty password",
			payload: registryPingPayload{
				Type:     portainer.DockerHubRegistry,
				URL:      "registry-1.docker.io",
				Username: "testuser",
				Password: "",
			},
			wantStatusCode: http.StatusBadRequest,
		},
		{
			name: "invalid payload - invalid registry type",
			payload: registryPingPayload{
				Type:     99,
				URL:      "registry-1.docker.io",
				Username: "testuser",
				Password: "testpass",
			},
			wantStatusCode: http.StatusBadRequest,
		},
		{
			name: "valid payload with invalid credentials returns 200 with success=false",
			payload: registryPingPayload{
				Type:     portainer.DockerHubRegistry,
				URL:      "registry-1.docker.io",
				Username: "invalid-user",
				Password: "invalid-pass",
			},
			wantStatusCode: http.StatusOK,
			wantSuccess:    false,
			checkResponse: func(t *testing.T, resp registryPingResponse) {
				assert.False(t, resp.Success)
				assert.Contains(t, resp.Message, "Access token invalid")
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payloadBytes, err := json.Marshal(tt.payload)
			require.NoError(t, err)

			r := httptest.NewRequest(http.MethodPost, "/registries/ping", bytes.NewReader(payloadBytes))
			w := httptest.NewRecorder()

			// Set up security context
			restrictedContext := &security.RestrictedRequestContext{
				IsAdmin:         true,
				UserID:          1,
				UserMemberships: []portainer.TeamMembership{},
			}
			ctx := security.StoreRestrictedRequestContext(r, restrictedContext)
			r = r.WithContext(ctx)

			handlerErr := handler.pingRegistry(w, r)

			if tt.wantStatusCode != http.StatusOK {
				// For error cases, check the handler returns an error
				require.NotNil(t, handlerErr)
				assert.Equal(t, tt.wantStatusCode, handlerErr.StatusCode)
			} else {
				// For success cases (200), even if the ping failed
				require.Nil(t, handlerErr)
				assert.Equal(t, http.StatusOK, w.Code)

				var resp registryPingResponse
				err := json.Unmarshal(w.Body.Bytes(), &resp)
				require.NoError(t, err)

				assert.Equal(t, tt.wantSuccess, resp.Success)

				if tt.checkResponse != nil {
					tt.checkResponse(t, resp)
				}
			}
		})
	}
}

func TestHandler_pingRegistry_DockerHubURL(t *testing.T) {
	t.Parallel()

	handler, _ := newTestHandler(t)

	t.Run("empty URL for DockerHub gets default URL", func(t *testing.T) {
		payload := registryPingPayload{
			Type:     portainer.DockerHubRegistry,
			URL:      "", // Empty URL
			Username: "testuser",
			Password: "testpass",
		}

		payloadBytes, err := json.Marshal(payload)
		require.NoError(t, err)

		r := httptest.NewRequest(http.MethodPost, "/registries/ping", bytes.NewReader(payloadBytes))
		w := httptest.NewRecorder()

		restrictedContext := &security.RestrictedRequestContext{
			IsAdmin:         true,
			UserID:          1,
			UserMemberships: []portainer.TeamMembership{},
		}
		ctx := security.StoreRestrictedRequestContext(r, restrictedContext)
		r = r.WithContext(ctx)

		handlerErr := handler.pingRegistry(w, r)

		// Should succeed (handler returns nil), but the ping itself will fail with auth error
		require.Nil(t, handlerErr)
		assert.Equal(t, http.StatusOK, w.Code)

		var resp registryPingResponse
		err = json.Unmarshal(w.Body.Bytes(), &resp)
		require.NoError(t, err)

		// The ping will fail (invalid credentials), but that's expected
		// We're just testing that the URL defaulting logic works
		assert.False(t, resp.Success)
		assert.Contains(t, resp.Message, "Access token invalid")
	})
}
