package utils

import (
	"testing"
)

func TestIsBinaryPresent(t *testing.T) {
	type testCase struct {
		Name     string
		Binary   string
		Expected bool
	}
	testCases := []testCase{
		{
			Name:     "not existing",
			Binary:   "qwgq-er-gerw",
			Expected: false,
		},
		{
			Name:     "docker-compose exists",
			Binary:   "docker-compose",
			Expected: true,
		},
	}

	for _, tc := range testCases {
		got := IsBinaryPresent(tc.Binary)
		if got != tc.Expected {
			t.Errorf("Error in test %s got = %v, and Expected = %v.", tc.Name, got, tc.Expected)
		}
	}

}
