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
		{"", "d/e/f", `d\e\f`},
		{"", "./d/e/f", `d\e\f`},
		{"", "../d/e/f", `d\e\f`},
		{"", "/d/e/f", `d\e\f`},
		{"", "../../../windows/system.ini", `windows\system.ini`},
		{"", `C:\windows\system.ini`, `windows\system.ini`},
		{"", `..\..\..\..\C:\windows\system.ini`, `windows\system.ini`},
		{"", `\\server\a\b\c`, `server\a\b\c`},
		{"", `..\..\..\..\\server\a\b\c`, `server\a\b\c`},

		{".", "", "."},
		{".", ".", "."},
		{".", "d/e/f", `d\e\f`},
		{".", "./d/e/f", `d\e\f`},
		{".", "../d/e/f", `d\e\f`},
		{".", "/d/e/f", `d\e\f`},
		{".", "../../../windows/system.ini", `windows\system.ini`},
		{".", `C:\windows\system.ini`, `windows\system.ini`},
		{".", `..\..\..\..\C:\windows\system.ini`, `windows\system.ini`},
		{".", `\\server\a\b\c`, `server\a\b\c`},
		{".", `..\..\..\..\\server\a\b\c`, `server\a\b\c`},

		{"./", "", "."},
		{"./", ".", "."},
		{"./", "d/e/f", `d\e\f`},
		{"./", "./d/e/f", `d\e\f`},
		{"./", "../d/e/f", `d\e\f`},
		{"./", "/d/e/f", `d\e\f`},
		{"./", "../../../windows/system.ini", `windows\system.ini`},
		{"./", `C:\windows\system.ini`, `windows\system.ini`},
		{"./", `..\..\..\..\C:\windows\system.ini`, `windows\system.ini`},
		{"./", `\\server\a\b\c`, `server\a\b\c`},
		{"./", `..\..\..\..\\server\a\b\c`, `server\a\b\c`},

		{"a/b/c", "", `a\b\c`},
		{"a/b/c", ".", `a\b\c`},
		{"a/b/c", "d/e/f", `a\b\c\d\e\f`},
		{"a/b/c", "./d/e/f", `a\b\c\d\e\f`},
		{"a/b/c", "../d/e/f", `a\b\c\d\e\f`},
		{"a/b/c", "../../../windows/system.ini", `a\b\c\windows\system.ini`},
		{"a/b/c", `C:\windows\system.ini`, `a\b\c\C:\windows\system.ini`},
		{"a/b/c", `..\..\..\..\C:\windows\system.ini`, `a\b\c\C:\windows\system.ini`},
		{"a/b/c", `\\server\a\b\c`, `a\b\c\server\a\b\c`},
		{"a/b/c", `..\..\..\..\\server\a\b\c`, `a\b\c\server\a\b\c`},

		{"/a/b/c", "", `\a\b\c`},
		{"/a/b/c", ".", `\a\b\c`},
		{"/a/b/c", "d/e/f", `\a\b\c\d\e\f`},
		{"/a/b/c", "./d/e/f", `\a\b\c\d\e\f`},
		{"/a/b/c", "../d/e/f", `\a\b\c\d\e\f`},
		{"/a/b/c", "../../../windows/system.ini", `\a\b\c\windows\system.ini`},
		{"/a/b/c", `C:\windows\system.ini`, `\a\b\c\C:\windows\system.ini`},
		{"/a/b/c", `..\..\..\..\C:\windows\system.ini`, `\a\b\c\C:\windows\system.ini`},
		{"/a/b/c", `\\server\a\b\c`, `\a\b\c\server\a\b\c`},
		{"/a/b/c", `..\..\..\..\\server\a\b\c`, `\a\b\c\server\a\b\c`},

		{"./a/b/c", "", `a\b\c`},
		{"./a/b/c", ".", `a\b\c`},
		{"./a/b/c", "d/e/f", `a\b\c\d\e\f`},
		{"./a/b/c", "./d/e/f", `a\b\c\d\e\f`},
		{"./a/b/c", "../d/e/f", `a\b\c\d\e\f`},
		{"./a/b/c", "../../../windows/system.ini", `a\b\c\windows\system.ini`},
		{"./a/b/c", `C:\windows\system.ini`, `a\b\c\C:\windows\system.ini`},
		{"./a/b/c", `..\..\..\..\C:\windows\system.ini`, `a\b\c\C:\windows\system.ini`},
		{"./a/b/c", `\\server\a\b\c`, `a\b\c\server\a\b\c`},
		{"./a/b/c", `..\..\..\..\\server\a\b\c`, `a\b\c\server\a\b\c`},

		{"../a/b/c", "", `..\a\b\c`},
		{"../a/b/c", ".", `..\a\b\c`},
		{"../a/b/c", "d/e/f", `..\a\b\c\d\e\f`},
		{"../a/b/c", "./d/e/f", `..\a\b\c\d\e\f`},
		{"../a/b/c", "../d/e/f", `..\a\b\c\d\e\f`},
		{"../a/b/c", "../../../windows/system.ini", `..\a\b\c\windows\system.ini`},
		{"../a/b/c", `C:\windows\system.ini`, `..\a\b\c\C:\windows\system.ini`},
		{"../a/b/c", `..\..\..\..\C:\windows\system.ini`, `..\a\b\c\C:\windows\system.ini`},
		{"../a/b/c", `\\server\a\b\c`, `..\a\b\c\server\a\b\c`},
		{"../a/b/c", `..\..\..\..\\server\a\b\c`, `..\a\b\c\server\a\b\c`},

		{"C:/a/b/c", "", `C:\a\b\c`},
		{"C:/a/b/c", ".", `C:\a\b\c`},
		{"C:/a/b/c", "d/e/f", `C:\a\b\c\d\e\f`},
		{"C:/a/b/c", "./d/e/f", `C:\a\b\c\d\e\f`},
		{"C:/a/b/c", "../d/e/f", `C:\a\b\c\d\e\f`},
		{"C:/a/b/c", "../../../windows/system.ini", `C:\a\b\c\windows\system.ini`},
		{"C:/a/b/c", `C:\windows\system.ini`, `C:\a\b\c\C:\windows\system.ini`},
		{"C:/a/b/c", `..\..\..\..\C:\windows\system.ini`, `C:\a\b\c\C:\windows\system.ini`},
		{"C:/a/b/c", `\\server\a\b\c`, `C:\a\b\c\server\a\b\c`},
		{"C:/a/b/c", `..\..\..\..\\server\a\b\c`, `C:\a\b\c\server\a\b\c`},

		{`\\server\a\b\c`, "", `\\server\a\b\c`},
		{`\\server\a\b\c`, ".", `\\server\a\b\c`},
		{`\\server\a\b\c`, "d/e/f", `\\server\a\b\c\d\e\f`},
		{`\\server\a\b\c`, "./d/e/f", `\\server\a\b\c\d\e\f`},
		{`\\server\a\b\c`, "../d/e/f", `\\server\a\b\c\d\e\f`},
		{`\\server\a\b\c`, "../../../windows/system.ini", `\\server\a\b\c\windows\system.ini`},
		{`\\server\a\b\c`, `C:\windows\system.ini`, `\\server\a\b\c\C:\windows\system.ini`},
		{`\\server\a\b\c`, `..\..\..\C:\windows\system.ini`, `\\server\a\b\c\C:\windows\system.ini`},
		{`\\server\a\b\c`, `\\server\a\b\c`, `\\server\a\b\c\server\a\b\c`},
		{`\\server\a\b\c`, `..\..\..\\server\a\b\c`, `\\server\a\b\c\server\a\b\c`},
	}

	for _, c := range ts {
		r := JoinPaths(c.trusted, c.untrusted)
		if r != c.expected {
			t.Fatalf("expected '%s', got '%s'. Inputs = '%s', '%s'", c.expected, r, c.trusted, c.untrusted)
		}
	}
}
