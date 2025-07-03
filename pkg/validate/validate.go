package validate

import (
	"net"
	"net/url"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"
)

var (
	hexadecimalRegex = regexp.MustCompile(`^[0-9a-fA-F]+$`)
	dnsNameRegex     = regexp.MustCompile(`^([a-zA-Z0-9_]{1}[a-zA-Z0-9_-]{0,62}){1}(\.[a-zA-Z0-9_]{1}[a-zA-Z0-9_-]{0,62})*[\._]?$`)
)

func IsURL(urlString string) bool {
	if len(urlString) == 0 {
		return false
	}

	strTemp := urlString
	if !strings.Contains(urlString, "://") {
		// support no indicated urlscheme
		// http:// is appended so url.Parse will succeed
		strTemp = "http://" + urlString
	}

	u, err := url.Parse(strTemp)
	return err == nil && u.Host != ""
}

func IsUUID(uuidString string) bool {
	return uuid.Validate(uuidString) == nil
}

func IsHexadecimal(hexString string) bool {
	return hexadecimalRegex.MatchString(hexString)
}

func HasWhitespaceOnly(s string) bool {
	return len(s) > 0 && strings.TrimSpace(s) == ""
}

func MinStringLength(s string, len int) bool {
	return utf8.RuneCountInString(s) >= len
}

func Matches(s, pattern string) bool {
	match, err := regexp.MatchString(pattern, s)
	return err == nil && match
}

func IsNonPositive(f float64) bool {
	return f <= 0
}

func InRange(val, left, right float64) bool {
	if left > right {
		left, right = right, left
	}

	return val >= left && val <= right
}

func IsHost(s string) bool {
	return IsIP(s) || IsDNSName(s)
}

func IsIP(s string) bool {
	return net.ParseIP(s) != nil
}

func IsDNSName(s string) bool {
	if s == "" || len(strings.ReplaceAll(s, ".", "")) > 255 {
		// constraints already violated
		return false
	}

	return !IsIP(s) && dnsNameRegex.MatchString(s)
}

func IsTrustedOrigin(s string) bool {
	// Reject if a scheme is present
	if strings.Contains(s, "://") {
		return false
	}

	// Prepend http:// for parsing
	strTemp := "http://" + s
	parsedOrigin, err := url.Parse(strTemp)
	if err != nil {
		return false
	}

	// Validate host, and ensure no user, path, query, fragment, port, etc.
	if parsedOrigin.Host == "" ||
		parsedOrigin.User != nil ||
		parsedOrigin.Path != "" ||
		parsedOrigin.RawQuery != "" ||
		parsedOrigin.Fragment != "" ||
		parsedOrigin.Opaque != "" ||
		parsedOrigin.RawFragment != "" ||
		parsedOrigin.RawPath != "" ||
		parsedOrigin.Port() != "" {
		return false
	}

	return true
}
