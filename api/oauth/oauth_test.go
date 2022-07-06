package oauth

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/oauth/oauthtest"
	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"
)

func Test_getOAuthToken(t *testing.T) {
	validCode := "valid-code"
	srv, config := oauthtest.RunOAuthServer(validCode, &portainer.OAuthSettings{})
	defer srv.Close()

	t.Run("getOAuthToken fails upon invalid code", func(t *testing.T) {
		code := ""
		_, err := getOAuthToken(code, config)
		if err == nil {
			t.Errorf("getOAuthToken should fail upon providing invalid code; code=%v", code)
		}
	})

	t.Run("getOAuthToken succeeds upon providing valid code", func(t *testing.T) {
		code := validCode
		token, err := getOAuthToken(code, config)

		if token == nil || err != nil {
			t.Errorf("getOAuthToken should successfully return access token upon providing valid code")
		}
	})
}

func Test_getIdToken(t *testing.T) {
	verifiedToken := `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NTM1NDA3MjksImV4cCI6MTY4NTA3NjcyOSwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJHaXZlbk5hbWUiOiJKb2huIiwiU3VybmFtZSI6IkRvZSIsIkdyb3VwcyI6WyJGaXJzdCIsIlNlY29uZCJdfQ.GeU8XCV4Y4p5Vm-i63Aj7UP5zpb_0Zxb7-DjM2_z-s8`
	nonVerifiedToken := `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NTM1NDA3MjksImV4cCI6MTY4NTA3NjcyOSwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJHaXZlbk5hbWUiOiJKb2huIiwiU3VybmFtZSI6IkRvZSIsIkdyb3VwcyI6WyJGaXJzdCIsIlNlY29uZCJdfQ.`
	claims := map[string]interface{}{
		"iss":       "Online JWT Builder",
		"iat":       float64(1653540729),
		"exp":       float64(1685076729),
		"aud":       "www.example.com",
		"sub":       "john.doe@example.com",
		"GivenName": "John",
		"Surname":   "Doe",
		"Groups":    []interface{}{"First", "Second"},
	}

	tests := []struct {
		testName       string
		idToken        string
		expectedResult map[string]interface{}
		expectedError  error
	}{
		{
			testName:       "should return claims if token exists and is verified",
			idToken:        verifiedToken,
			expectedResult: claims,
			expectedError:  nil,
		},
		{
			testName:       "should return claims if token exists but is not verified",
			idToken:        nonVerifiedToken,
			expectedResult: claims,
			expectedError:  nil,
		},
		{
			testName:       "should return empty map if token does not exist",
			idToken:        "",
			expectedResult: make(map[string]interface{}),
			expectedError:  nil,
		},
	}

	for _, tc := range tests {
		t.Run(tc.testName, func(t *testing.T) {
			token := &oauth2.Token{}
			if tc.idToken != "" {
				token = token.WithExtra(map[string]interface{}{"id_token": tc.idToken})
			}

			result, err := getIdToken(token)
			assert.Equal(t, err, tc.expectedError)
			assert.Equal(t, result, tc.expectedResult)
		})
	}
}

func Test_getResource(t *testing.T) {
	srv, config := oauthtest.RunOAuthServer("", &portainer.OAuthSettings{})
	defer srv.Close()

	t.Run("should fail upon missing Authorization Bearer header", func(t *testing.T) {
		_, err := getResource("", config)
		if err == nil {
			t.Errorf("getResource should fail if access token is not provided in auth bearer header")
		}
	})

	t.Run("should fail upon providing incorrect Authorization Bearer header", func(t *testing.T) {
		_, err := getResource("incorrect-token", config)
		if err == nil {
			t.Errorf("getResource should fail if incorrect access token provided in auth bearer header")
		}
	})

	t.Run("should succeed upon providing correct Authorization Bearer header", func(t *testing.T) {
		_, err := getResource(oauthtest.AccessToken, config)
		if err != nil {
			t.Errorf("getResource should succeed if correct access token provided in auth bearer header")
		}
	})
}

func Test_Authenticate(t *testing.T) {
	code := "valid-code"
	authService := NewService()

	t.Run("should fail if user identifier does not get matched in resource", func(t *testing.T) {
		srv, config := oauthtest.RunOAuthServer(code, &portainer.OAuthSettings{})
		defer srv.Close()

		_, err := authService.Authenticate(code, config)
		if err == nil {
			t.Error("Authenticate should fail to extract username from resource if incorrect UserIdentifier provided")
		}
	})

	t.Run("should succeed if user identifier does get matched in resource", func(t *testing.T) {
		config := &portainer.OAuthSettings{UserIdentifier: "username"}
		srv, config := oauthtest.RunOAuthServer(code, config)
		defer srv.Close()

		username, err := authService.Authenticate(code, config)
		if err != nil {
			t.Errorf("Authenticate should succeed to extract username from resource if correct UserIdentifier provided; UserIdentifier=%s", config.UserIdentifier)
		}

		want := "test-oauth-user"
		if username != want {
			t.Errorf("Authenticate should return correct username; got=%s, want=%s", username, want)
		}
	})

}
