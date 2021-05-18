package oauth

import (
	"encoding/json"
	"reflect"
	"sort"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

func Test_getTeams(t *testing.T) {
	t.Run("returns empty string if OAuthAutoMapTeamMemberships is disabled", func(t *testing.T) {
		oauthSettings := &portainer.OAuthSettings{
			OAuthAutoMapTeamMemberships: false,
		}
		datamap := map[string]interface{}{}

		oAuthTeams, err := getTeams(datamap, oauthSettings)
		if err != nil {
			t.Errorf("getTeams should not fail if OAuthAutoMapTeamMemberships is disabled")
		}

		if !reflect.DeepEqual(oAuthTeams, []string{}) {
			t.Errorf("getTeams should return empty slice if OAuthAutoMapTeamMemberships is disabled")
		}
	})

	t.Run("fails with non-existent oauth claim name", func(t *testing.T) {
		oauthSettings := &portainer.OAuthSettings{
			OAuthAutoMapTeamMemberships: true,
			TeamMemberships: portainer.TeamMemberships{
				OAuthClaimName: "none",
			},
		}
		datamap := map[string]interface{}{}

		_, err := getTeams(datamap, oauthSettings)
		if err == nil {
			t.Errorf("getTeams should fail if OAuthClaimName value not found in oauth resource")
		}
	})

	t.Run("successfully extracts claim value", func(t *testing.T) {
		oauthSettings := &portainer.OAuthSettings{
			OAuthAutoMapTeamMemberships: true,
			TeamMemberships: portainer.TeamMemberships{
				OAuthClaimName: "group",
			},
		}
		datamap := map[string]interface{}{"group": "test"}

		got, err := getTeams(datamap, oauthSettings)
		if err != nil {
			t.Errorf("getTeams should not fail in extracting oauth team %s", "test")
		}

		want := []string{"test"}
		if !reflect.DeepEqual(got, want) {
			t.Errorf("getTeams should successfully extract oauth team; got=%v, want=%v", got, want)
		}
	})

	t.Run("successfully extracts multiple claim values", func(t *testing.T) {
		oauthSettings := &portainer.OAuthSettings{
			OAuthAutoMapTeamMemberships: true,
			TeamMemberships: portainer.TeamMemberships{
				OAuthClaimName: "group",
			},
		}

		datamap := make(map[string]interface{})
		json.Unmarshal([]byte(`{ "group": ["d", "a", "20", "100"] }`), &datamap)

		got, err := getTeams(datamap, oauthSettings)
		if err != nil {
			t.Errorf("getTeams should not fail in extracting multiple oauth teams")
		}

		want := []string{"100", "20", "a", "d"}

		sort.Strings(got)
		sort.Strings(want)

		if !reflect.DeepEqual(got, want) {
			t.Errorf("getTeams should successfully extract multiple oauth teams; got=%v, want=%v", got, want)
		}
	})
}

func Test_getNestedClaimValues(t *testing.T) {
	type test struct {
		title        string
		inputJsonStr string
		want         []string
	}
	tests := []test{
		{
			"succeeds with null",
			`{ "groups": null }`,
			[]string{},
		},
		{
			"succeeds with string",
			`{ "groups": "Prod" }`,
			[]string{"Prod"},
		},
		{
			"succeeds with int",
			`{ "groups": 5 }`,
			[]string{"5"},
		},
		{
			"succeeds with float",
			`{ "groups": 5.123 }`,
			[]string{"5.123"},
		},
		{
			"succeeds with nested string",
			`{ "groups": { "membership": "Prod" }}`,
			[]string{"Prod"},
		},
		{
			"succeeds with nested multiple string",
			`{ 
				"groups": {
					"group": "Test",
					"membership": "Prod"
				}
			}`,
			[]string{"Test", "Prod"},
		},
		{
			"succeeds with nested multiple any",
			`{ 
				"groups": {
					"group": 1,
					"membership": "Prod"
				}
			}`,
			[]string{"1", "Prod"},
		},
		{
			"succeeds with list string",
			`{ "groups": [ "Everyone", "Users", "Domain Users" ] }`,
			[]string{"Everyone", "Users", "Domain Users"},
		},
		{
			"succeeds with nested list string",
			`{ "groups": { "nested" : [ "Everyone", "Users", "Domain Users" ] }}`,
			[]string{"Everyone", "Users", "Domain Users"},
		},
		{
			"succeeds with nested multiple list any",
			`{
				"groups": {
					"nested" : [ "Users" ],
					"2": { "": [ 5, "100" ]}
				}
			}`,
			[]string{"Users", "5", "100"},
		},
	}

	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			jsonMap := make(map[string]interface{})
			err := json.Unmarshal([]byte(test.inputJsonStr), &jsonMap)
			if err != nil {
				t.Errorf(`"%s" failed with error "%v"`, test.title, err)
			}

			got, err := getNestedClaimValues(jsonMap)
			if err != nil {
				t.Errorf(`"%s" failed with error "%v"`, test.title, err)
			}

			// sort the values as they appear out of order due to recursive function calls
			sort.Strings(got)
			sort.Strings(test.want)

			if want := test.want; !reflect.DeepEqual(got, want) {
				t.Errorf("\"%s\" failed:\ngot=%v\nwant=%v", test.title, got, want)
			}
		})
	}
}

func Test_getUsername(t *testing.T) {
	t.Run("fails for non-matching user identifier", func(t *testing.T) {
		oauthSettings := &portainer.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"name": "john"}

		_, err := getUsername(datamap, oauthSettings)
		if err == nil {
			t.Errorf("getUsername should fail if user identifier doesn't exist as key in oauth userinfo object")
		}
	})

	t.Run("fails if username is empty string", func(t *testing.T) {
		oauthSettings := &portainer.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": ""}

		_, err := getUsername(datamap, oauthSettings)
		if err == nil {
			t.Errorf("getUsername should fail if username from oauth userinfo object is empty string")
		}
	})

	t.Run("fails if username is 0 int", func(t *testing.T) {
		oauthSettings := &portainer.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": 0}

		_, err := getUsername(datamap, oauthSettings)
		if err == nil {
			t.Errorf("getUsername should fail if username from oauth userinfo object is 0 val int")
		}
	})

	t.Run("fails if username is negative int", func(t *testing.T) {
		oauthSettings := &portainer.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": -1}

		_, err := getUsername(datamap, oauthSettings)
		if err == nil {
			t.Errorf("getUsername should fail if username from oauth userinfo object is -1 (negative) int")
		}
	})

	t.Run("succeeds if username is matched and is not empty", func(t *testing.T) {
		oauthSettings := &portainer.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": "john"}

		_, err := getUsername(datamap, oauthSettings)
		if err != nil {
			t.Errorf("getUsername should succeed if username from oauth userinfo object matched and non-empty")
		}
	})

	// looks like a bug!?
	t.Run("fails if username is matched and is positive int", func(t *testing.T) {
		oauthSettings := &portainer.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": 1}

		_, err := getUsername(datamap, oauthSettings)
		if err == nil {
			t.Errorf("getUsername should fail if username from oauth userinfo object matched is positive int")
		}
	})

	t.Run("succeeds if username is matched and is non-zero (or negative) float", func(t *testing.T) {
		oauthSettings := &portainer.OAuthSettings{UserIdentifier: "username"}
		datamap := map[string]interface{}{"username": 1.1}

		_, err := getUsername(datamap, oauthSettings)
		if err != nil {
			t.Errorf("getUsername should succeed if username from oauth userinfo object matched and non-zero (or negative)")
		}
	})
}
