package ws

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSplitExecCommand(t *testing.T) {
	t.Parallel()

	f := func(input string, expected []string) {
		t.Helper()
		require.Equal(t, expected, SplitExecCommand(input))
	}

	f("", nil)
	f("bash", []string{"bash"})
	f("env TERM=xterm-256color /bin/bash", []string{"env", "TERM=xterm-256color", "/bin/bash"})
	f("sh -c 'echo a b'", []string{"sh", "-c", "echo a b"})
	f("sh -c 'command -v bash >/dev/null 2>&1 && exec bash || exec sh'",
		[]string{"sh", "-c", "command -v bash >/dev/null 2>&1 && exec bash || exec sh"})
	f("a  b", []string{"a", "b"})
	f("'unterminated", []string{"unterminated"})
}
