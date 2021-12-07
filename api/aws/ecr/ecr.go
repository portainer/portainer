package ecr

import (
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/ecr"
)

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
