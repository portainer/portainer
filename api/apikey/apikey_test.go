package apikey

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_generateRandomKey(t *testing.T) {
	is := assert.New(t)

	tests := []struct {
		name      string
		wantLenth int
	}{
		{
			name:      "Generate a random key of length 16",
			wantLenth: 16,
		},
		{
			name:      "Generate a random key of length 32",
			wantLenth: 32,
		},
		{
			name:      "Generate a random key of length 64",
			wantLenth: 64,
		},
		{
			name:      "Generate a random key of length 128",
			wantLenth: 128,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := generateRandomKey(tt.wantLenth)
			is.Equal(tt.wantLenth, len(got))
		})
	}

	t.Run("Generated keys are unique", func(t *testing.T) {
		keys := make(map[string]bool)
		for i := 0; i < 100; i++ {
			key := generateRandomKey(8)
			_, ok := keys[string(key)]
			is.False(ok)
			keys[string(key)] = true
		}
	})
}
