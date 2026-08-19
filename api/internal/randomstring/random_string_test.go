package randomstring

import (
	"testing"

	"github.com/portainer/portainer/pkg/fips"
	"github.com/stretchr/testify/require"
)

func init() {
	fips.InitFIPS(false)
}

func TestRandomString(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		name     string
		length   int
		expected int
	}{
		{
			name:     "zero length",
			length:   0,
			expected: 0,
		},
		{
			name:     "short string",
			length:   5,
			expected: 5,
		},
		{
			name:     "longer string",
			length:   20,
			expected: 20,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := RandomString(tc.length)
			require.Len(t, result, tc.expected)

			// Verify all characters are from the expected alphabet
			for _, char := range result {
				require.Contains(t, letterBytes, string(char))
			}
		})
	}
}

func TestRandomStringUniqueness(t *testing.T) {
	t.Parallel()
	// Generate multiple random strings and verify they are different
	const numStrings = 100
	const stringLength = 10

	generated := make(map[string]bool)

	for range numStrings {
		str := RandomString(stringLength)
		require.Len(t, str, stringLength)

		// Check if we've seen this string before (very unlikely for random strings)
		require.False(t, generated[str], "Generated duplicate random string: %s", str)
		generated[str] = true
	}
}
