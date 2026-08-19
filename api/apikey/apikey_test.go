package apikey

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_generateRandomKey(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	tests := []struct {
		name       string
		wantLength int
	}{
		{
			name:       "Generate a random key of length 16",
			wantLength: 16,
		},
		{
			name:       "Generate a random key of length 32",
			wantLength: 32,
		},
		{
			name:       "Generate a random key of length 64",
			wantLength: 64,
		},
		{
			name:       "Generate a random key of length 128",
			wantLength: 128,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GenerateRandomKey(tt.wantLength)
			is.Len(got, tt.wantLength)
		})
	}

	t.Run("Generated keys are unique", func(t *testing.T) {
		keys := make(map[string]bool)

		for range 100 {
			key := GenerateRandomKey(8)
			_, ok := keys[string(key)]
			is.False(ok)

			keys[string(key)] = true
		}
	})
}
