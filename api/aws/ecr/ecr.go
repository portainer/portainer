package ecr

import (
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/ecr"
)

// Registry represents an ECR registry endpoint information.
// This struct is used to parse and validate ECR endpoint URLs.
type Registry struct {
	ID     string // AWS account ID (empty for accountless endpoints like "ecr-fips.us-west-1.amazonaws.com")
	FIPS   bool   // Whether this is a FIPS endpoint (contains "-fips" in the URL)
	Region string // AWS region (e.g., "us-east-1", "us-gov-west-1")
	Public bool   // Whether this is ecr-public.aws.com
}

type (
	Service struct {
		accessKey string
		secretKey string
		region    string
		client    *ecr.Client
	}
)

func NewService(accessKey, secretKey, region string) *Service {
	options := ecr.Options{
		Region:      region,
		Credentials: aws.NewCredentialsCache(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	}

	client := ecr.New(options)

	return &Service{
		accessKey: accessKey,
		secretKey: secretKey,
		region:    region,
		client:    client,
	}
}
