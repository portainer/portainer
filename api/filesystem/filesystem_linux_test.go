package filesystem

import "testing"

func TestJoinPaths(t *testing.T) {
	var ts = []struct {
		trusted   string
		untrusted string
		expected  string
	}{
		{"", "", "."},
		{"", ".", "."},
		{"", "d/e/f", "d/e/f"},
		{"", "./d/e/f", "d/e/f"},
		{"", "../d/e/f", "d/e/f"},
		{"", "/d/e/f", "d/e/f"},
		{"", "../../../etc/shadow", "etc/shadow"},

		{".", "", "."},
		{".", ".", "."},
		{".", "d/e/f", "d/e/f"},
		{".", "./d/e/f", "d/e/f"},
		{".", "../d/e/f", "d/e/f"},
		{".", "/d/e/f", "d/e/f"},
		{".", "../../../etc/shadow", "etc/shadow"},

		{"./", "", "."},
		{"./", ".", "."},
		{"./", "d/e/f", "d/e/f"},
		{"./", "./d/e/f", "d/e/f"},
		{"./", "../d/e/f", "d/e/f"},
		{"./", "/d/e/f", "d/e/f"},
		{"./", "../../../etc/shadow", "etc/shadow"},

		{"a/b/c", "", "a/b/c"},
		{"a/b/c", ".", "a/b/c"},
		{"a/b/c", "d/e/f", "a/b/c/d/e/f"},
		{"a/b/c", "./d/e/f", "a/b/c/d/e/f"},
		{"a/b/c", "../d/e/f", "a/b/c/d/e/f"},
		{"a/b/c", "../../../etc/shadow", "a/b/c/etc/shadow"},

		{"/a/b/c", "", "/a/b/c"},
		{"/a/b/c", ".", "/a/b/c"},
		{"/a/b/c", "d/e/f", "/a/b/c/d/e/f"},
		{"/a/b/c", "./d/e/f", "/a/b/c/d/e/f"},
		{"/a/b/c", "../d/e/f", "/a/b/c/d/e/f"},
		{"/a/b/c", "../../../etc/shadow", "/a/b/c/etc/shadow"},

		{"./a/b/c", "", "a/b/c"},
		{"./a/b/c", ".", "a/b/c"},
		{"./a/b/c", "d/e/f", "a/b/c/d/e/f"},
		{"./a/b/c", "./d/e/f", "a/b/c/d/e/f"},
		{"./a/b/c", "../d/e/f", "a/b/c/d/e/f"},
		{"./a/b/c", "../../../etc/shadow", "a/b/c/etc/shadow"},

		{"../a/b/c", "", "../a/b/c"},
		{"../a/b/c", ".", "../a/b/c"},
		{"../a/b/c", "d/e/f", "../a/b/c/d/e/f"},
		{"../a/b/c", "./d/e/f", "../a/b/c/d/e/f"},
		{"../a/b/c", "../d/e/f", "../a/b/c/d/e/f"},
		{"../a/b/c", "../../../etc/shadow", "../a/b/c/etc/shadow"},
	}

	for _, c := range ts {
		r := JoinPaths(c.trusted, c.untrusted)
		if r != c.expected {
			t.Fatalf("expected '%s', got '%s'. Inputs = '%s', '%s'", c.expected, r, c.trusted, c.untrusted)
		}
	}
}
