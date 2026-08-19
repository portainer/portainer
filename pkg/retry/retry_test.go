package retry

import (
	"errors"
	"fmt"
	"math"
	"testing"
	"testing/synctest"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRetryTime(t *testing.T) {
	t.Parallel()
	cases := []struct {
		failures int
		secGte   int
		secLte   int
	}{
		{0, 5, 15},
		{1, 5, 15},
		{2, 30, 40},
		{3, 90, 100},
		{4, 90, 100},
		{5, 90, 100},
	}
	for _, tt := range cases {
		t.Run(fmt.Sprintf("failures=%d", tt.failures), func(t *testing.T) {
			previous := time.Duration(math.MaxInt64)

			for range 5 {
				sec := RetryTime(tt.failures)
				assert.GreaterOrEqual(t, sec, time.Duration(tt.secGte)*time.Second)
				assert.LessOrEqual(t, sec, time.Duration(tt.secLte)*time.Second)
				assert.NotEqual(t, sec, previous)
				previous = sec
			}
		})
	}
}

func TestRetryWithWarnings(t *testing.T) {
	t.Parallel()
	// different number of retries than the default
	settings := Settings{
		MaxRetries:    7,
		RetryTimeFunc: RetryTime,
	}

	cases := []struct {
		failures      int
		expectSuccess bool
	}{}

	for i := range settings.MaxRetries + 3 {
		cases = append(cases, struct {
			failures      int
			expectSuccess bool
		}{i, i < settings.MaxRetries})
	}

	for _, tt := range cases {
		t.Run(fmt.Sprintf("failures=%d", tt.failures), func(t *testing.T) {
			synctest.Test(t, func(t *testing.T) {
				attempts := 0
				expectedErr := errors.New("temporary error")
				result, err := RetryWithWarnings("test-operation", settings, func() (string, error) {
					attempts++
					if attempts <= tt.failures {
						return "", expectedErr
					}
					return "success", nil
				})

				if tt.expectSuccess {
					require.NoError(t, err)
					assert.Equal(t, "success", result)
					assert.Equal(t, tt.failures+1, attempts)
				} else {
					require.Error(t, err)
					assert.Equal(t, expectedErr, err)
					assert.Empty(t, result)
					assert.Equal(t, settings.MaxRetries, attempts)
				}
			})
		})
	}
}
