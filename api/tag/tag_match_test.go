package tag

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
)

func TestFullMatch(t *testing.T) {
	cases := []struct {
		name           string
		edgeGroupTags  []portainer.TagID
		environmentTag tagSet
		expected       bool
	}{
		{
			name:           "environment tag partially match edge group tags",
			edgeGroupTags:  []portainer.TagID{1, 2, 3},
			environmentTag: Set([]portainer.TagID{1, 2}),
			expected:       false,
		},
		{
			name:           "edge group tags equal to environment tags",
			edgeGroupTags:  []portainer.TagID{1, 2},
			environmentTag: Set([]portainer.TagID{1, 2}),
			expected:       true,
		},
		{
			name:           "environment tags fully match edge group tags",
			edgeGroupTags:  []portainer.TagID{1, 2},
			environmentTag: Set([]portainer.TagID{1, 2, 3}),
			expected:       true,
		},
		{
			name:           "environment tags do not match edge group tags",
			edgeGroupTags:  []portainer.TagID{1, 2},
			environmentTag: Set([]portainer.TagID{3, 4}),
			expected:       false,
		},
		{
			name:           "edge group has no tags and environment has tags",
			edgeGroupTags:  []portainer.TagID{},
			environmentTag: Set([]portainer.TagID{1, 2}),
			expected:       false,
		},
		{
			name:           "edge group has tags and environment has no tags",
			edgeGroupTags:  []portainer.TagID{1, 2},
			environmentTag: Set([]portainer.TagID{}),
			expected:       false,
		},
		{
			name:           "both edge group and environment have no tags",
			edgeGroupTags:  []portainer.TagID{},
			environmentTag: Set([]portainer.TagID{}),
			expected:       false,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			result := FullMatch(tc.edgeGroupTags, tc.environmentTag)
			if result != tc.expected {
				t.Errorf("Expected %v, got %v", tc.expected, result)
			}
		})
	}
}

func TestPartialMatch(t *testing.T) {
	cases := []struct {
		name           string
		edgeGroupTags  []portainer.TagID
		environmentTag tagSet
		expected       bool
	}{
		{
			name:           "environment tags partially match edge group tags 1",
			edgeGroupTags:  []portainer.TagID{1, 2, 3},
			environmentTag: Set([]portainer.TagID{1, 2}),
			expected:       true,
		},
		{
			name:           "environment tags partially match edge group tags 2",
			edgeGroupTags:  []portainer.TagID{1, 2, 3},
			environmentTag: Set([]portainer.TagID{1, 4, 5}),
			expected:       true,
		},
		{
			name:           "edge group tags equal to environment tags",
			edgeGroupTags:  []portainer.TagID{1, 2},
			environmentTag: Set([]portainer.TagID{1, 2}),
			expected:       true,
		},
		{
			name:           "environment tags fully match edge group tags",
			edgeGroupTags:  []portainer.TagID{1, 2},
			environmentTag: Set([]portainer.TagID{1, 2, 3}),
			expected:       true,
		},
		{
			name:           "environment tags do not match edge group tags",
			edgeGroupTags:  []portainer.TagID{1, 2},
			environmentTag: Set([]portainer.TagID{3, 4}),
			expected:       false,
		},
		{
			name:           "edge group has no tags and environment has tags",
			edgeGroupTags:  []portainer.TagID{},
			environmentTag: Set([]portainer.TagID{1, 2}),
			expected:       false,
		},
		{
			name:           "edge group has tags and environment has no tags",
			edgeGroupTags:  []portainer.TagID{1, 2},
			environmentTag: Set([]portainer.TagID{}),
			expected:       false,
		},
		{
			name:           "both edge group and environment have no tags",
			edgeGroupTags:  []portainer.TagID{},
			environmentTag: Set([]portainer.TagID{}),
			expected:       false,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			result := PartialMatch(tc.edgeGroupTags, tc.environmentTag)
			if result != tc.expected {
				t.Errorf("Expected %v, got %v", tc.expected, result)
			}
		})
	}
}
