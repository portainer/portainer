package gittypes

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNormalizeURL(t *testing.T) {
	t.Parallel()

	f := func(input, expected string) {
		t.Helper()
		got, err := NormalizeURL(input)
		require.NoError(t, err)
		require.Equal(t, expected, got)
	}

	f("https://github.com/org/repo.git", "https://github.com/org/repo")
	f("https://github.com/org/repo/", "https://github.com/org/repo")
	f("https://github.com/org/repo.git/", "https://github.com/org/repo")
	f("HTTPS://github.com/org/repo", "https://github.com/org/repo")
	f("https://GitHub.COM/org/repo", "https://github.com/org/repo")
	f("https://user:pass@github.com/org/repo.git", "https://github.com/org/repo")
	f("https://github.com/org/repo", "https://github.com/org/repo")
}
