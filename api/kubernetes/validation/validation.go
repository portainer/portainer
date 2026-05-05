package validation

// borrowed from apimachinery@v0.17.2/pkg/util/validation/validation.go
// https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apimachinery/pkg/util/validation/validation.go

import (
	"fmt"
	"regexp"
	"strings"
)

const dns1123LabelFmt string = "[a-z0-9]([-a-z0-9]*[a-z0-9])?"
const dns1123SubdomainFmt string = dns1123LabelFmt + "(\\." + dns1123LabelFmt + ")*"
const DNS1123SubdomainMaxLength int = 253

var dns1123SubdomainRegexp = regexp.MustCompile("^" + dns1123SubdomainFmt + "$")

// IsDNS1123Subdomain tests for a string that conforms to the definition of a subdomain in DNS (RFC 1123).
func IsDNS1123Subdomain(value string) []string {
	var errs []string
	if len(value) > DNS1123SubdomainMaxLength {
		errs = append(errs, MaxLenError(DNS1123SubdomainMaxLength))
	}
	if !dns1123SubdomainRegexp.MatchString(value) {
		errs = append(errs, RegexError(dns1123SubdomainFmt, "example.com"))
	}
	return errs
}

// MaxLenError returns a string explanation of a "string too long" validation failure.
func MaxLenError(length int) string {
	return fmt.Sprintf("must be no more than %d characters", length)
}

// RegexError returns a string explanation of a regex validation failure.
func RegexError(fmt string, examples ...string) string {
	if len(examples) == 0 {
		return "must match the regex " + fmt
	}

	var sb strings.Builder
	sb.WriteString("must match the regex ")
	sb.WriteString(fmt)
	sb.WriteString(" (e.g. ")
	for i := range examples {
		if i > 0 {
			sb.WriteString(" or ")
		}
		sb.WriteString("'")
		sb.WriteString(examples[i])
		sb.WriteString("'")
	}
	sb.WriteString(")")
	return sb.String()
}
