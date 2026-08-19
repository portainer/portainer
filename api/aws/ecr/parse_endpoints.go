package ecr

import (
	"fmt"
	"net/url"
	"regexp"
	"strings"
)

// ecrEndpointPattern matches all valid ECR endpoints including account-prefixed and accountless formats.
// Based on AWS ECR credential helper regex but extended to support accountless endpoints.
//
// Supported formats:
//   - Account-prefixed: 123456789012.dkr.ecr-fips.us-east-1.amazonaws.com
//   - Account-prefixed (hyphen): 123456789012.dkr-ecr-fips.us-west-1.on.aws
//   - Accountless service: ecr-fips.us-west-1.amazonaws.com
//   - Accountless API: ecr-fips.us-east-1.api.aws
//   - Non-FIPS variants: All formats above without "-fips"
//
// Regex groups:
//   - Group 1: Full account prefix (optional) - e.g., "123456789012.dkr." or "123456789012.dkr-"
//   - Group 2: Account ID (optional) - e.g., "123456789012"
//   - Group 3: FIPS flag (optional) - either "-fips" or empty string
//   - Group 4: Region - e.g., "us-east-1", "us-gov-west-1"
//   - Group 5: Domain suffix - e.g., "amazonaws.com", "api.aws"
var ecrEndpointPattern = regexp.MustCompile(
	`^((\d{12})\.dkr[\.\-])?ecr(\-fips)?\.([a-zA-Z0-9][a-zA-Z0-9-_]*)\.(amazonaws\.(?:com(?:\.cn)?|eu)|api\.aws|on\.(?:aws|amazonwebservices\.com\.cn)|sc2s\.sgov\.gov|c2s\.ic\.gov|cloud\.adc-e\.uk|csp\.hci\.ic\.gov)$`,
)

// ParseECREndpoint parses an ECR registry URL and extracts registry information.

// This function replaces the AWS ECR credential helper library's ExtractRegistry function,
// which only supports account-prefixed endpoints.
//
// Reference: https://docs.aws.amazon.com/general/latest/gr/ecr.html
func ParseECREndpoint(urlStr string) (*Registry, error) {
	// Normalize URL by adding https:// prefix if not present
	if !strings.HasPrefix(urlStr, "https://") && !strings.HasPrefix(urlStr, "http://") {
		urlStr = "https://" + urlStr
	}

	u, err := url.Parse(urlStr)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}

	hostname := u.Hostname()

	// Special case: ECR Public
	// ECR Public uses a different domain and doesn't have FIPS variant
	if hostname == "ecr-public.aws.com" {
		return &Registry{
			FIPS:   false,
			Public: true,
		}, nil
	}

	// Parse standard ECR endpoints using regex
	matches := ecrEndpointPattern.FindStringSubmatch(hostname)
	if len(matches) == 0 {
		return nil, fmt.Errorf("not a valid ECR endpoint: %s", hostname)
	}

	return &Registry{
		ID:     matches[2],            // Account ID (may be empty for accountless endpoints)
		FIPS:   matches[3] == "-fips", // Check if "-fips" is present
		Region: matches[4],            // AWS region
		Public: false,
	}, nil
}
