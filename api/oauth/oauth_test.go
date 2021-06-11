package oauth

import (
	"reflect"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/oauth/oauthtest"
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

		oauthInfo, err := authService.Authenticate(code, config)
		if err != nil {
			t.Errorf("Authenticate should succeed to extract username from resource if correct UserIdentifier provided; UserIdentifier=%s", config.UserIdentifier)
		}

		want := "test-oauth-user"
		if oauthInfo.Username != want {
			t.Errorf("Authenticate should return correct username; got=%s, want=%s", oauthInfo.Username, want)
		}
	})

	t.Run("should return team data (claims) upon group name matched in resource", func(t *testing.T) {
		config := &portainer.OAuthSettings{
			UserIdentifier:              "username",
			OAuthAutoMapTeamMemberships: true,
			TeamMemberships: portainer.TeamMemberships{
				OAuthClaimName: "groups",
			},
		}
		srv, config := oauthtest.RunOAuthServer(code, config)
		defer srv.Close()

		oauthInfo, err := authService.Authenticate(code, config)
		if err != nil {
			t.Errorf("Authenticate should succeed to extract username from resource if correct UserIdentifier provided; UserIdentifier=%s", config.UserIdentifier)
		}

		want := []string{"testing"}
		if !reflect.DeepEqual(oauthInfo.Teams, want) {
			t.Errorf("Authenticate should return resource team claims upon resource claim name match; got=%s, want=%s", oauthInfo.Teams, want)
		}
	})
}
