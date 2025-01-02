package tag

import (
	"reflect"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

func TestIntersectionCount(t *testing.T) {
	cases := []struct {
		name     string
		setA     tagSet
		setB     tagSet
		expected int
	}{
		{
			name:     "positive numbers set intersection",
			setA:     Set([]portainer.TagID{1, 2, 3, 4, 5}),
			setB:     Set([]portainer.TagID{4, 5, 6, 7}),
			expected: 2,
		},
		{
			name:     "empty setA intersection",
			setA:     Set([]portainer.TagID{1, 2, 3}),
			setB:     Set([]portainer.TagID{}),
			expected: 0,
		},
		{
			name:     "empty setB intersection",
			setA:     Set([]portainer.TagID{}),
			setB:     Set([]portainer.TagID{1, 2, 3}),
			expected: 0,
		},
		{
			name:     "no common elements sets intersection",
			setA:     Set([]portainer.TagID{1, 2, 3}),
			setB:     Set([]portainer.TagID{4, 5, 6}),
			expected: 0,
		},
		{
			name:     "equal sets intersection",
			setA:     Set([]portainer.TagID{1, 2, 3}),
			setB:     Set([]portainer.TagID{1, 2, 3}),
			expected: 3,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			result := IntersectionCount(tc.setA, tc.setB)
			if result != tc.expected {
				t.Errorf("Expected %v, got %v", tc.expected, result)
			}
		})
	}
}

func TestUnion(t *testing.T) {
	cases := []struct {
		name     string
		setA     tagSet
		setB     tagSet
		expected tagSet
	}{
		{
			name:     "non-duplicate set union",
			setA:     Set([]portainer.TagID{1, 2, 3}),
			setB:     Set([]portainer.TagID{4, 5, 6}),
			expected: Set([]portainer.TagID{1, 2, 3, 4, 5, 6}),
		},
		{
			name:     "empty setA union",
			setA:     Set([]portainer.TagID{1, 2, 3}),
			setB:     Set([]portainer.TagID{}),
			expected: Set([]portainer.TagID{1, 2, 3}),
		},
		{
			name:     "empty setB union",
			setA:     Set([]portainer.TagID{}),
			setB:     Set([]portainer.TagID{1, 2, 3}),
			expected: Set([]portainer.TagID{1, 2, 3}),
		},
		{
			name:     "duplicate elements in set union",
			setA:     Set([]portainer.TagID{1, 2, 3}),
			setB:     Set([]portainer.TagID{3, 4, 5}),
			expected: Set([]portainer.TagID{1, 2, 3, 4, 5}),
		},
		{
			name:     "equal sets union",
			setA:     Set([]portainer.TagID{1, 2, 3}),
			setB:     Set([]portainer.TagID{1, 2, 3}),
			expected: Set([]portainer.TagID{1, 2, 3}),
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			result := Union(tc.setA, tc.setB)
			if !reflect.DeepEqual(result, tc.expected) {
				t.Errorf("Expected %v, got %v", tc.expected, result)
			}
		})
	}
}

func TestContains(t *testing.T) {
	cases := []struct {
		name     string
		setA     tagSet
		setB     []portainer.TagID
		expected bool
	}{
		{
			name:     "setA contains setB",
			setA:     Set([]portainer.TagID{1, 2, 3}),
			setB:     []portainer.TagID{1, 2},
			expected: true,
		},
		{
			name:     "setA equals to setB",
			setA:     Set([]portainer.TagID{1, 2}),
			setB:     []portainer.TagID{1, 2},
			expected: true,
		},
		{
			name:     "setA contains parts of setB",
			setA:     Set([]portainer.TagID{1, 2}),
			setB:     []portainer.TagID{1, 2, 3},
			expected: false,
		},
		{
			name:     "setA does not contain setB",
			setA:     Set([]portainer.TagID{1, 2}),
			setB:     []portainer.TagID{3, 4},
			expected: false,
		},
		{
			name:     "setA is empty and setB is not empty",
			setA:     Set([]portainer.TagID{}),
			setB:     []portainer.TagID{1, 2},
			expected: false,
		},
		{
			name:     "setA is not empty and setB is empty",
			setA:     Set([]portainer.TagID{1, 2}),
			setB:     []portainer.TagID{},
			expected: false,
		},
		{
			name:     "setA is empty and setB is empty",
			setA:     Set([]portainer.TagID{}),
			setB:     []portainer.TagID{},
			expected: false,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			result := Contains(tc.setA, tc.setB)
			if result != tc.expected {
				t.Errorf("Expected %v, got %v", tc.expected, result)
			}
		})
	}
}

func TestDifference(t *testing.T) {
	cases := []struct {
		name     string
		setA     tagSet
		setB     tagSet
		expected tagSet
	}{
		{
			name:     "positive numbers set difference",
			setA:     Set([]portainer.TagID{1, 2, 3, 4, 5}),
			setB:     Set([]portainer.TagID{4, 5, 6, 7}),
			expected: Set([]portainer.TagID{1, 2, 3}),
		},
		{
			name:     "empty set difference",
			setA:     Set([]portainer.TagID{1, 2, 3}),
			setB:     Set([]portainer.TagID{}),
			expected: Set([]portainer.TagID{1, 2, 3}),
		},
		{
			name:     "equal sets difference",
			setA:     Set([]portainer.TagID{1, 2, 3}),
			setB:     Set([]portainer.TagID{1, 2, 3}),
			expected: Set([]portainer.TagID{}),
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			result := Difference(tc.setA, tc.setB)
			if !reflect.DeepEqual(result, tc.expected) {
				t.Errorf("Expected %v, got %v", tc.expected, result)
			}
		})
	}
}
