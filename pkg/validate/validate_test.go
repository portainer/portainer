package validate

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_IsURL(t *testing.T) {
	testCases := []struct {
		name           string
		url            string
		expectedResult bool
	}{
		{
			name:           "simple url",
			url:            "https://google.com",
			expectedResult: true,
		},
		{
			name:           "empty",
			url:            "",
			expectedResult: false,
		},
		{
			name:           "no schema",
			url:            "google.com",
			expectedResult: true,
		},
		{
			name:           "path",
			url:            "https://google.com/some/thing",
			expectedResult: true,
		},
		{
			name:           "query params",
			url:            "https://google.com/some/thing?a=5&b=6",
			expectedResult: true,
		},
		{
			name:           "no top level domain",
			url:            "google",
			expectedResult: true,
		},
		{
			name:           "Unicode URL",
			url:            "www.xn--exampe-7db.ai",
			expectedResult: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := IsURL(tc.url)
			require.Equal(t, tc.expectedResult, result)
		})
	}
}

func Test_IsUUID(t *testing.T) {
	testCases := []struct {
		name           string
		uuid           string
		expectedResult bool
	}{
		{
			name:           "empty",
			uuid:           "",
			expectedResult: false,
		},
		{
			name:           "version 3 UUID",
			uuid:           "060507eb-3b9a-362e-b850-d5f065eea403",
			expectedResult: true,
		},
		{
			name:           "version 4 UUID",
			uuid:           "63e695ee-48a9-498a-98b3-9472ff75e09f",
			expectedResult: true,
		},
		{
			name:           "version 5 UUID",
			uuid:           "5daabcd8-f17e-568c-aa6f-da9d92c7032c",
			expectedResult: true,
		},
		{
			name:           "text",
			uuid:           "something like this",
			expectedResult: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := IsUUID(tc.uuid)
			require.Equal(t, tc.expectedResult, result)
		})
	}
}

func Test_IsHexadecimal(t *testing.T) {
	testCases := []struct {
		name           string
		hex            string
		expectedResult bool
	}{
		{
			name:           "empty",
			hex:            "",
			expectedResult: false,
		},
		{
			name:           "hex",
			hex:            "48656C6C6F20736F6D657468696E67",
			expectedResult: true,
		},
		{
			name:           "text",
			hex:            "something like this",
			expectedResult: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := IsHexadecimal(tc.hex)
			require.Equal(t, tc.expectedResult, result)
		})
	}
}

func Test_HasWhitespaceOnly(t *testing.T) {
	testCases := []struct {
		name           string
		s              string
		expectedResult bool
	}{
		{
			name:           "empty",
			s:              "",
			expectedResult: false,
		},
		{
			name:           "space",
			s:              " ",
			expectedResult: true,
		},
		{
			name:           "tab",
			s:              "\t",
			expectedResult: true,
		},
		{
			name:           "text",
			s:              "something like this",
			expectedResult: false,
		},
		{
			name:           "all whitespace",
			s:              "\t\n\v\f\r ",
			expectedResult: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := HasWhitespaceOnly(tc.s)
			require.Equal(t, tc.expectedResult, result)
		})
	}
}

func Test_MinStringLength(t *testing.T) {
	testCases := []struct {
		name           string
		s              string
		len            int
		expectedResult bool
	}{
		{
			name:           "empty + zero len",
			s:              "",
			len:            0,
			expectedResult: true,
		},
		{
			name:           "empty + non zero len",
			s:              "",
			len:            10,
			expectedResult: false,
		},
		{
			name:           "long text + non zero len",
			s:              "something else",
			len:            10,
			expectedResult: true,
		},
		{
			name:           "multibyte characters - enough",
			s:              "X生",
			len:            2,
			expectedResult: true,
		},
		{
			name:           "multibyte characters - not enough",
			s:              "X生",
			len:            3,
			expectedResult: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := MinStringLength(tc.s, tc.len)
			require.Equal(t, tc.expectedResult, result)
		})
	}
}

func Test_Matches(t *testing.T) {
	testCases := []struct {
		name           string
		s              string
		pattern        string
		expectedResult bool
	}{
		{
			name:           "empty",
			s:              "",
			pattern:        "",
			expectedResult: true,
		},
		{
			name:           "space",
			s:              "something else",
			pattern:        " ",
			expectedResult: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := Matches(tc.s, tc.pattern)
			require.Equal(t, tc.expectedResult, result)
		})
	}
}

func Test_IsNonPositive(t *testing.T) {
	testCases := []struct {
		name           string
		f              float64
		expectedResult bool
	}{
		{
			name:           "zero",
			f:              0,
			expectedResult: true,
		},
		{
			name:           "positive",
			f:              1,
			expectedResult: false,
		},
		{
			name:           "negative",
			f:              -1,
			expectedResult: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := IsNonPositive(tc.f)
			require.Equal(t, tc.expectedResult, result)
		})
	}
}

func Test_InRange(t *testing.T) {
	testCases := []struct {
		name           string
		f              float64
		left           float64
		right          float64
		expectedResult bool
	}{
		{
			name:           "zero",
			f:              0,
			left:           0,
			right:          0,
			expectedResult: true,
		},
		{
			name:           "equal left",
			f:              1,
			left:           1,
			right:          2,
			expectedResult: true,
		},
		{
			name:           "equal right",
			f:              2,
			left:           1,
			right:          2,
			expectedResult: true,
		},
		{
			name:           "above",
			f:              3,
			left:           1,
			right:          2,
			expectedResult: false,
		},
		{
			name:           "below",
			f:              0,
			left:           1,
			right:          2,
			expectedResult: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := InRange(tc.f, tc.left, tc.right)
			require.Equal(t, tc.expectedResult, result)
		})
	}
}

func Test_IsHost(t *testing.T) {
	testCases := []struct {
		name           string
		s              string
		expectedResult bool
	}{
		{
			name:           "empty",
			s:              "",
			expectedResult: false,
		},
		{
			name:           "ip address",
			s:              "192.168.1.1",
			expectedResult: true,
		},
		{
			name:           "hostname",
			s:              "google.com",
			expectedResult: true,
		},
		{
			name:           "text",
			s:              "Something like this",
			expectedResult: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := IsHost(tc.s)
			require.Equal(t, tc.expectedResult, result)
		})
	}
}

func Test_IsIP(t *testing.T) {
	testCases := []struct {
		name           string
		s              string
		expectedResult bool
	}{
		{
			name:           "empty",
			s:              "",
			expectedResult: false,
		},
		{
			name:           "ip address",
			s:              "192.168.1.1",
			expectedResult: true,
		},
		{
			name:           "hostname",
			s:              "google.com",
			expectedResult: false,
		},
		{
			name:           "text",
			s:              "Something like this",
			expectedResult: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := IsIP(tc.s)
			require.Equal(t, tc.expectedResult, result)
		})
	}
}

func Test_IsDNSName(t *testing.T) {
	testCases := []struct {
		name           string
		s              string
		expectedResult bool
	}{
		{
			name:           "empty",
			s:              "",
			expectedResult: false,
		},
		{
			name:           "ip address",
			s:              "192.168.1.1",
			expectedResult: false,
		},
		{
			name:           "hostname",
			s:              "google.com",
			expectedResult: true,
		},
		{
			name:           "text",
			s:              "Something like this",
			expectedResult: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := IsDNSName(tc.s)
			require.Equal(t, tc.expectedResult, result)
		})
	}
}

func Test_IsTrustedOrigin(t *testing.T) {
	f := func(s string, expected bool) {
		t.Helper()

		result := IsTrustedOrigin(s)
		if result != expected {
			t.Fatalf("unexpected result for %q; got %t; want %t", s, result, expected)
		}
	}

	// Valid trusted origins - host only
	f("localhost", true)
	f("example.com", true)
	f("192.168.1.1", true)
	f("api.example.com", true)
	f("subdomain.example.org", true)

	// Invalid trusted origins - host with port (no longer allowed)
	f("localhost:8080", false)
	f("example.com:3000", false)
	f("192.168.1.1:443", false)
	f("api.example.com:9000", false)

	// Invalid trusted origins - empty or malformed
	f("", false)
	f("invalid url", false)
	f("://example.com", false)

	// Invalid trusted origins - with scheme
	f("http://example.com", false)
	f("https://localhost", false)
	f("ftp://192.168.1.1", false)

	// Invalid trusted origins - with user info
	f("user@example.com", false)
	f("user:pass@localhost", false)

	// Invalid trusted origins - with path
	f("example.com/path", false)
	f("localhost/api", false)
	f("192.168.1.1/static", false)

	// Invalid trusted origins - with query parameters
	f("example.com?param=value", false)
	f("localhost:8080?query=test", false)

	// Invalid trusted origins - with fragment
	f("example.com#fragment", false)
	f("localhost:3000#section", false)

	// Invalid trusted origins - with multiple invalid components
	f("https://user@example.com/path?query=value#fragment", false)
	f("http://localhost:8080/api/v1?param=test", false)

	// Edge cases - ports are no longer allowed
	f("example.com:0", false)     // port 0 is no longer valid
	f("example.com:65535", false) // max port number is no longer valid
	f("example.com:99999", false) // invalid port number
	f("example.com:-1", false)    // negative port
}
