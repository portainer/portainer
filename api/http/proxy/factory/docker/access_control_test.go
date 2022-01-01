package docker

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_getUniqueElements(t *testing.T) {
	cases := []struct {
		description string
		input       string
		expected    []string
	}{
		{
			description: "no items padded",
			input:       "    ",
			expected:    []string{},
		},
		{
			description: "single item",
			input:       "a",
			expected:    []string{"a"},
		},
		{
			description: "single item padded",
			input:       " a   ",
			expected:    []string{"a"},
		},
		{
			description: "multiple items",
			input:       "a,b",
			expected:    []string{"a", "b"},
		},
		{
			description: "multiple items padded",
			input:       " a , b  ",
			expected:    []string{"a", "b"},
		},
		{
			description: "multiple items with empty values",
			input:       " a , ,b  ",
			expected:    []string{"a", "b"},
		},
		{
			description: "duplicates",
			input:       " a , a  ",
			expected:    []string{"a"},
		},
		{
			description: "mix with duplicates",
			input:       " a ,b, a  ",
			expected:    []string{"a", "b"},
		},
	}

	for _, tt := range cases {
		t.Run(tt.description, func(t *testing.T) {
			result := getUniqueElements(tt.input)
			assert.ElementsMatch(t, result, tt.expected)
		})
	}
}
