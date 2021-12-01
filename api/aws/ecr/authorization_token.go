package ecr

import (
	"context"
	"encoding/base64"
	"fmt"
	"strings"
	"time"
)

func (s *Service) GetEncodedAuthorizationToken() (token *string, expiry *time.Time, err error) {
	getAuthorizationTokenOutput, err := s.client.GetAuthorizationToken(context.TODO(), nil)
	if err != nil {
		return
	}

	if len(getAuthorizationTokenOutput.AuthorizationData) == 0 {
		err = fmt.Errorf("AuthorizationData is empty")
		return
	}

	authData := getAuthorizationTokenOutput.AuthorizationData[0]

	token = authData.AuthorizationToken
	expiry = authData.ExpiresAt

	return
}

func (s *Service) GetAuthorizationToken() (token *string, expiry *time.Time, err error) {
	tokenEncodedStr, expiry, err := s.GetEncodedAuthorizationToken()
	if err != nil {
		return
	}

	tokenByte, err := base64.StdEncoding.DecodeString(*tokenEncodedStr)
	if err != nil {
		return
	}
	tokenStr := string(tokenByte)
	token = &tokenStr

	return
}

func (s *Service) ParseAuthorizationToken(token string) (username string, password string, err error) {
	if len(token) == 0 {
		return
	}

	splitToken := strings.Split(token, ":")
	if len(splitToken) < 2 {
		err = fmt.Errorf("invalid ECR authorization token")
		return
	}

	username = splitToken[0]
	password = splitToken[1]

	return
}
