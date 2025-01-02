package edge

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetPortainerURLFromEdgeKey(t *testing.T) {
	tests := []struct {
		name     string
		edgeKey  string
		expected string
	}{
		{
			name:     "ValidEdgeKey",
			edgeKey:  "aHR0cHM6Ly9wb3J0YWluZXIuaW98cG9ydGFpbmVyLmlvOjgwMDB8YXNkZnwx",
			expected: "https://portainer.io",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := GetPortainerURLFromEdgeKey(tt.edgeKey)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestIsValidEdgeStackName(t *testing.T) {
	f := func(name string, expected bool) {
		if IsValidEdgeStackName(name) != expected {
			t.Fatalf("expected %v, found %v", expected, IsValidEdgeStackName(name))
		}
	}

	f("edge-stack", true)
	f("edge_stack", true)
	f("edgestack", true)
	f("edgestack11", true)
	f("111", true)
	f("111edgestack", true)
	f("edge#stack", false)
	f("edge stack", false)
	f("Edge_stack", false)
	f("EdgeStack", false)
	f("-edgestack", false)
	f("_edgestack", false)
	f("#edgestack", false)
	f("/edgestack", false)
	f("#edgestack", false)
	f("édgestack", false)
	f("", false)
	f(" ", false)
	f("-", false)
	f("_", false)
	f("E", false)
	f("eedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackdgeedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackedgestackstack", false)
}
