package ws

import "strings"

// SplitExecCommand splits a command string into exec argv, treating a
// single-quoted segment as one argument even if it contains spaces (e.g.
// `sh -c 'echo a b'` stays 3 tokens instead of being shredded on every
// space). Single quotes are not escapable, matching POSIX shell semantics for
// single-quoted strings; there is no support for double quotes since callers
// only ever need one quoted tail argument (a `sh -c` script).
func SplitExecCommand(command string) []string {
	var (
		args    []string
		current strings.Builder
		inQuote bool
		started bool
	)

	for _, r := range command {
		switch {
		case r == '\'':
			inQuote = !inQuote
			started = true
		case r == ' ' && !inQuote:
			if started {
				args = append(args, current.String())
				current.Reset()
				started = false
			}
		default:
			current.WriteRune(r)
			started = true
		}
	}

	if started {
		args = append(args, current.String())
	}

	return args
}
