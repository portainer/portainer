package kubernetes

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/jwt"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockJWTService implements portainer.JWTService for testing
type MockJWTService struct {
	generateTokenFunc func(data *portainer.TokenData) (string, error)
}

func (m *MockJWTService) GenerateToken(data *portainer.TokenData) (string, time.Time, error) {
	if m.generateTokenFunc != nil {
		token, err := m.generateTokenFunc(data)

		return token, time.Now().Add(24 * time.Hour), err
	}

	return "mock-token", time.Now().Add(24 * time.Hour), nil
}

func (m *MockJWTService) GenerateTokenForKubeconfig(data *portainer.TokenData) (string, error) {
	if m.generateTokenFunc != nil {
		return m.generateTokenFunc(data)
	}

	return "mock-kubeconfig-token", nil
}

func (m *MockJWTService) ParseAndVerifyToken(token string) (*portainer.TokenData, string, time.Time, error) {
	return &portainer.TokenData{ID: 1, Username: "mock", Role: portainer.AdministratorRole}, "mock-id", time.Now().Add(24 * time.Hour), nil
}

func (m *MockJWTService) SetUserSessionDuration(userSessionDuration time.Duration) {
	// Mock implementation - not used in tests
}

func TestBaseTransport_AddTokenForExec(t *testing.T) {
	t.Parallel()
	// Setup test store and JWT service
	_, store := datastore.MustNewTestStore(t, true, false)

	// Create test users
	adminUser := &portainer.User{
		ID:       1,
		Username: "admin",
		Role:     portainer.AdministratorRole,
	}
	err := store.User().Create(adminUser)
	require.NoError(t, err)

	standardUser := &portainer.User{
		ID:       2,
		Username: "standard",
		Role:     portainer.StandardUserRole,
	}
	err = store.User().Create(standardUser)
	require.NoError(t, err)

	// Create JWT service
	jwtService, err := jwt.NewService("24h", store)
	require.NoError(t, err)

	// Create base transport
	transport := &baseTransport{
		jwtService: jwtService,
	}

	tests := []struct {
		name           string
		tokenData      *portainer.TokenData
		setupRequest   func(*http.Request) *http.Request
		expectError    bool
		errorMsg       string
		expectPanic    bool
		verifyResponse func(*testing.T, *http.Request, *portainer.TokenData)
	}{
		{
			name: "admin user - successful token generation",
			tokenData: &portainer.TokenData{
				ID:       adminUser.ID,
				Username: adminUser.Username,
				Role:     adminUser.Role,
			},
			setupRequest: func(req *http.Request) *http.Request {
				return req.WithContext(security.StoreTokenData(req, &portainer.TokenData{
					ID:       adminUser.ID,
					Username: adminUser.Username,
					Role:     adminUser.Role,
				}))
			},
			expectError: false,
			verifyResponse: func(t *testing.T, req *http.Request, tokenData *portainer.TokenData) {
				authHeader := req.Header.Get("Authorization")
				assert.NotEmpty(t, authHeader)
				assert.True(t, strings.HasPrefix(authHeader, "Bearer "))

				token := authHeader[7:] // Remove "Bearer " prefix
				parsedTokenData, _, _, err := jwtService.ParseAndVerifyToken(token)
				require.NoError(t, err)
				assert.Equal(t, tokenData.ID, parsedTokenData.ID)
				assert.Equal(t, tokenData.Username, parsedTokenData.Username)
				assert.Equal(t, tokenData.Role, parsedTokenData.Role)
			},
		},
		{
			name: "standard user - successful token generation",
			tokenData: &portainer.TokenData{
				ID:       standardUser.ID,
				Username: standardUser.Username,
				Role:     standardUser.Role,
			},
			setupRequest: func(req *http.Request) *http.Request {
				return req.WithContext(security.StoreTokenData(req, &portainer.TokenData{
					ID:       standardUser.ID,
					Username: standardUser.Username,
					Role:     standardUser.Role,
				}))
			},
			expectError: false,
			verifyResponse: func(t *testing.T, req *http.Request, tokenData *portainer.TokenData) {
				authHeader := req.Header.Get("Authorization")
				assert.NotEmpty(t, authHeader)
				assert.True(t, strings.HasPrefix(authHeader, "Bearer "))

				token := authHeader[7:] // Remove "Bearer " prefix
				parsedTokenData, _, _, err := jwtService.ParseAndVerifyToken(token)
				require.NoError(t, err)
				assert.Equal(t, tokenData.ID, parsedTokenData.ID)
				assert.Equal(t, tokenData.Username, parsedTokenData.Username)
				assert.Equal(t, tokenData.Role, parsedTokenData.Role)
			},
		},
		{
			name:      "request without token data in context",
			tokenData: nil,
			setupRequest: func(req *http.Request) *http.Request {
				return req // Don't add token data to context
			},
			expectError: true,
			errorMsg:    "Unable to find JWT data in request context",
		},
		{
			name:      "request with nil token data",
			tokenData: nil,
			setupRequest: func(req *http.Request) *http.Request {
				return req.WithContext(security.StoreTokenData(req, nil))
			},
			expectPanic: true,
		},
		{
			name: "JWT service failure",
			tokenData: &portainer.TokenData{
				ID:       1,
				Username: "test",
				Role:     portainer.AdministratorRole,
			},
			setupRequest: func(req *http.Request) *http.Request {
				return req.WithContext(security.StoreTokenData(req, &portainer.TokenData{
					ID:       1,
					Username: "test",
					Role:     portainer.AdministratorRole,
				}))
			},
			expectPanic: true,
		},
		{
			name: "verify authorization header format",
			tokenData: &portainer.TokenData{
				ID:       adminUser.ID,
				Username: adminUser.Username,
				Role:     adminUser.Role,
			},
			setupRequest: func(req *http.Request) *http.Request {
				return req.WithContext(security.StoreTokenData(req, &portainer.TokenData{
					ID:       adminUser.ID,
					Username: adminUser.Username,
					Role:     adminUser.Role,
				}))
			},
			expectError: false,
			verifyResponse: func(t *testing.T, req *http.Request, tokenData *portainer.TokenData) {
				authHeader := req.Header.Get("Authorization")
				assert.NotEmpty(t, authHeader)
				assert.True(t, strings.HasPrefix(authHeader, "Bearer "))

				token := authHeader[7:] // Remove "Bearer " prefix
				assert.NotEmpty(t, token)
			},
		},
		{
			name: "verify header is overwritten on subsequent calls",
			tokenData: &portainer.TokenData{
				ID:       adminUser.ID,
				Username: adminUser.Username,
				Role:     adminUser.Role,
			},
			setupRequest: func(req *http.Request) *http.Request {
				req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{
					ID:       adminUser.ID,
					Username: adminUser.Username,
					Role:     adminUser.Role,
				}))
				// Set an existing Authorization header
				req.Header.Set("Authorization", "Bearer old-token")

				return req
			},
			expectError: false,
			verifyResponse: func(t *testing.T, req *http.Request, tokenData *portainer.TokenData) {
				authHeader := req.Header.Get("Authorization")
				assert.NotEqual(t, "Bearer old-token", authHeader)
				assert.True(t, strings.HasPrefix(authHeader, "Bearer "))

				token := authHeader[7:] // Remove "Bearer " prefix
				parsedTokenData, _, _, err := jwtService.ParseAndVerifyToken(token)
				require.NoError(t, err)
				assert.Equal(t, tokenData.ID, parsedTokenData.ID)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request
			request := httptest.NewRequest("GET", "/", nil)
			request = tt.setupRequest(request)

			// Determine which transport to use based on test case
			var testTransport *baseTransport
			if tt.name == "JWT service failure" {
				testTransport = &baseTransport{
					jwtService: nil,
				}
			} else {
				testTransport = transport
			}

			// Call the function
			if tt.expectPanic {
				assert.Panics(t, func() {
					_ = testTransport.addTokenForExec(request)
				})
				return
			}

			err := testTransport.addTokenForExec(request)

			// Check results
			if tt.expectError {
				require.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
			} else {
				require.NoError(t, err)
				if tt.verifyResponse != nil {
					tt.verifyResponse(t, request, tt.tokenData)
				}
			}
		})
	}
}

func TestBaseTransport_AddTokenForExec_Integration(t *testing.T) {
	t.Parallel()
	// Create a test HTTP server to capture requests
	var capturedRequest *http.Request
	var capturedHeaders http.Header

	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedRequest = r
		capturedHeaders = r.Header.Clone()
		_, _ = w.Write([]byte("success"))
	}))
	defer testServer.Close()

	// Create mock JWT service
	mockJWTService := &MockJWTService{
		generateTokenFunc: func(data *portainer.TokenData) (string, error) {
			return "mock-token-" + data.Username, nil
		},
	}

	// Create base transport
	transport := &baseTransport{
		httpTransport: &http.Transport{},
		jwtService:    mockJWTService,
	}

	tests := []struct {
		name          string
		tokenData     *portainer.TokenData
		requestPath   string
		expectedToken string
	}{
		{
			name: "admin user exec request",
			tokenData: &portainer.TokenData{
				ID:       1,
				Username: "admin",
				Role:     portainer.AdministratorRole,
			},
			requestPath:   "/api/endpoints/1/kubernetes/api/v1/namespaces/default/pods/test-pod/exec",
			expectedToken: "mock-token-admin",
		},
		{
			name: "standard user exec request",
			tokenData: &portainer.TokenData{
				ID:       2,
				Username: "standard",
				Role:     portainer.StandardUserRole,
			},
			requestPath:   "/api/endpoints/1/kubernetes/api/v1/namespaces/default/pods/test-pod/exec",
			expectedToken: "mock-token-standard",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset captured data
			capturedRequest = nil
			capturedHeaders = nil

			// Create request to the test server
			request, err := http.NewRequest("POST", testServer.URL+tt.requestPath, strings.NewReader(""))
			require.NoError(t, err)

			// Add token data to request context
			request = request.WithContext(security.StoreTokenData(request, tt.tokenData))

			// Call proxyPodsRequest which triggers addTokenForExec for POST /exec requests
			resp, err := transport.proxyPodsRequest(request, "default")
			require.NoError(t, err)
			defer func() {
				err := resp.Body.Close()
				require.NoError(t, err)
			}()

			// Verify the response
			assert.Equal(t, http.StatusOK, resp.StatusCode)

			// Verify the request was captured
			assert.NotNil(t, capturedRequest)
			assert.Equal(t, "POST", capturedRequest.Method)
			assert.Equal(t, tt.requestPath, capturedRequest.URL.Path)

			// Verify the authorization header was set correctly
			capturedAuthHeader := capturedHeaders.Get("Authorization")
			assert.NotEmpty(t, capturedAuthHeader)
			assert.True(t, strings.HasPrefix(capturedAuthHeader, "Bearer "))
			assert.Equal(t, "Bearer "+tt.expectedToken, capturedAuthHeader)
		})
	}
}
