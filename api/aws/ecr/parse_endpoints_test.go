package ecr

import (
	"testing"
)

func TestParseECREndpoint(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name      string
		url       string
		want      *Registry
		wantError bool
	}{
		// Standard AWS Commercial - Account-prefixed FIPS
		{
			name: "account-prefixed FIPS us-east-1",
			url:  "123456789012.dkr.ecr-fips.us-east-1.amazonaws.com",
			want: &Registry{
				ID:     "123456789012",
				FIPS:   true,
				Region: "us-east-1",
				Public: false,
			},
		},
		{
			name: "account-prefixed FIPS us-west-2",
			url:  "123456789012.dkr.ecr-fips.us-west-2.amazonaws.com",
			want: &Registry{
				ID:     "123456789012",
				FIPS:   true,
				Region: "us-west-2",
				Public: false,
			},
		},

		// Accountless FIPS service endpoints
		{
			name: "accountless FIPS us-west-1",
			url:  "ecr-fips.us-west-1.amazonaws.com",
			want: &Registry{
				ID:     "",
				FIPS:   true,
				Region: "us-west-1",
				Public: false,
			},
		},
		{
			name: "accountless FIPS us-east-2",
			url:  "ecr-fips.us-east-2.amazonaws.com",
			want: &Registry{
				ID:     "",
				FIPS:   true,
				Region: "us-east-2",
				Public: false,
			},
		},

		// Accountless FIPS API endpoints
		{
			name: "accountless FIPS API us-west-1",
			url:  "ecr-fips.us-west-1.api.aws",
			want: &Registry{
				ID:     "",
				FIPS:   true,
				Region: "us-west-1",
				Public: false,
			},
		},
		{
			name: "accountless FIPS API us-east-1",
			url:  "ecr-fips.us-east-1.api.aws",
			want: &Registry{
				ID:     "",
				FIPS:   true,
				Region: "us-east-1",
				Public: false,
			},
		},

		// on.aws domain with hyphen separator
		{
			name: "account-prefixed FIPS hyphen us-west-1",
			url:  "123456789012.dkr-ecr-fips.us-west-1.on.aws",
			want: &Registry{
				ID:     "123456789012",
				FIPS:   true,
				Region: "us-west-1",
				Public: false,
			},
		},
		{
			name: "account-prefixed FIPS hyphen us-east-2",
			url:  "123456789012.dkr-ecr-fips.us-east-2.on.aws",
			want: &Registry{
				ID:     "123456789012",
				FIPS:   true,
				Region: "us-east-2",
				Public: false,
			},
		},

		// AWS GovCloud
		{
			name: "account-prefixed FIPS us-gov-east-1",
			url:  "123456789012.dkr.ecr-fips.us-gov-east-1.amazonaws.com",
			want: &Registry{
				ID:     "123456789012",
				FIPS:   true,
				Region: "us-gov-east-1",
				Public: false,
			},
		},
		{
			name: "account-prefixed FIPS us-gov-west-1",
			url:  "123456789012.dkr.ecr-fips.us-gov-west-1.amazonaws.com",
			want: &Registry{
				ID:     "123456789012",
				FIPS:   true,
				Region: "us-gov-west-1",
				Public: false,
			},
		},
		{
			name: "accountless FIPS us-gov-west-1",
			url:  "ecr-fips.us-gov-west-1.amazonaws.com",
			want: &Registry{
				ID:     "",
				FIPS:   true,
				Region: "us-gov-west-1",
				Public: false,
			},
		},
		{
			name: "accountless FIPS API us-gov-east-1",
			url:  "ecr-fips.us-gov-east-1.api.aws",
			want: &Registry{
				ID:     "",
				FIPS:   true,
				Region: "us-gov-east-1",
				Public: false,
			},
		},

		// ECR Public
		{
			name: "ecr-public",
			url:  "ecr-public.aws.com",
			want: &Registry{
				ID:     "",
				FIPS:   false,
				Region: "",
				Public: true,
			},
		},

		// Non-FIPS endpoints (valid ECR but FIPS=false)
		{
			name: "account-prefixed non-FIPS us-east-1",
			url:  "123456789012.dkr.ecr.us-east-1.amazonaws.com",
			want: &Registry{
				ID:     "123456789012",
				FIPS:   false,
				Region: "us-east-1",
				Public: false,
			},
		},
		{
			name: "accountless non-FIPS us-west-1",
			url:  "ecr.us-west-1.amazonaws.com",
			want: &Registry{
				ID:     "",
				FIPS:   false,
				Region: "us-west-1",
				Public: false,
			},
		},
		{
			name: "accountless non-FIPS API us-east-2",
			url:  "ecr.us-east-2.api.aws",
			want: &Registry{
				ID:     "",
				FIPS:   false,
				Region: "us-east-2",
				Public: false,
			},
		},

		// URLs with https:// prefix
		{
			name: "with https prefix",
			url:  "https://ecr-fips.us-west-1.amazonaws.com",
			want: &Registry{
				ID:     "",
				FIPS:   true,
				Region: "us-west-1",
				Public: false,
			},
		},

		// Invalid endpoints
		{
			name:      "not an ECR URL",
			url:       "not-an-ecr-url.com",
			wantError: true,
		},
		{
			name:      "invalid account ID length",
			url:       "123.dkr.ecr-fips.us-east-1.amazonaws.com",
			wantError: true,
		},
		{
			name:      "empty string",
			url:       "",
			wantError: true,
		},
		{
			name:      "docker hub",
			url:       "docker.io",
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseECREndpoint(tt.url)

			if tt.wantError {
				if err == nil {
					t.Errorf("ParseECREndpoint() expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("ParseECREndpoint() unexpected error: %v", err)
				return
			}

			if got.ID != tt.want.ID {
				t.Errorf("ParseECREndpoint() ID = %v, want %v", got.ID, tt.want.ID)
			}
			if got.FIPS != tt.want.FIPS {
				t.Errorf("ParseECREndpoint() FIPS = %v, want %v", got.FIPS, tt.want.FIPS)
			}
			if got.Region != tt.want.Region {
				t.Errorf("ParseECREndpoint() Region = %v, want %v", got.Region, tt.want.Region)
			}
			if got.Public != tt.want.Public {
				t.Errorf("ParseECREndpoint() Public = %v, want %v", got.Public, tt.want.Public)
			}
		})
	}
}
