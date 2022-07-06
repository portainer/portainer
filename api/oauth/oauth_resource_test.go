package oauth

import (
	"testing"

	portaineree "github.com/portainer/portainer/api"
)

func Test_getUsername(t *testing.T) {
	t.Run("fails for non-matching user identifier", func(t *testing.T) {
		oauthSettings := &portaineree.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"name": "john"}

		_, err := getUsername(datamap, oauthSettings)
		if err == nil {
			t.Errorf("getUsername should fail if user identifier doesn't exist as key in oauth userinfo object")
		}
	})

	t.Run("fails if username is empty string", func(t *testing.T) {
		oauthSettings := &portaineree.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": ""}

		_, err := getUsername(datamap, oauthSettings)
		if err == nil {
			t.Errorf("getUsername should fail if username from oauth userinfo object is empty string")
		}
	})

	t.Run("fails if username is 0 int", func(t *testing.T) {
		oauthSettings := &portaineree.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": 0}

		_, err := getUsername(datamap, oauthSettings)
		if err == nil {
			t.Errorf("getUsername should fail if username from oauth userinfo object is 0 val int")
		}
	})

	t.Run("fails if username is negative int", func(t *testing.T) {
		oauthSettings := &portaineree.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": -1}

		_, err := getUsername(datamap, oauthSettings)
		if err == nil {
			t.Errorf("getUsername should fail if username from oauth userinfo object is -1 (negative) int")
		}
	})

	t.Run("succeeds if username is matched and is not empty", func(t *testing.T) {
		oauthSettings := &portaineree.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": "john"}

		_, err := getUsername(datamap, oauthSettings)
		if err != nil {
			t.Errorf("getUsername should succeed if username from oauth userinfo object matched and non-empty")
		}
	})

	// looks like a bug!?
	t.Run("fails if username is matched and is positive int", func(t *testing.T) {
		oauthSettings := &portaineree.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": 1}

		_, err := getUsername(datamap, oauthSettings)
		if err == nil {
			t.Errorf("getUsername should fail if username from oauth userinfo object matched is positive int")
		}
	})

	t.Run("succeeds if username is matched and is non-zero (or negative) float", func(t *testing.T) {
		oauthSettings := &portaineree.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": 1.1}

		_, err := getUsername(datamap, oauthSettings)
		if err != nil {
			t.Errorf("getUsername should succeed if username from oauth userinfo object matched and non-zero (or negative)")
		}
	})
}
