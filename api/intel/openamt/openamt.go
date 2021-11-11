package openamt

import (
	"crypto/tls"
	"net/http"
	"time"
)

const (
	MPS_SERVER_ADDRESS = "https://localhost"
)

// Service represents a service for managing an OpenAMT server.
type Service struct {
	httpsClient *http.Client
}

// NewService initializes a new service.
func NewService() *Service {
	return &Service{
		httpsClient:
		&http.Client{
			Timeout: time.Second * time.Duration(5),
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
				Proxy:           http.ProxyFromEnvironment,
			},
		},
	}
}

type errorResponse struct {
	ErrorMsg string `json:"message"`
	Errors   []struct {
		ErrorMsg string `json:"msg"`
	} `json:"errors"`
}

func(service *Service) ConfigureDefault() error {
	token, err := service.executeOpenAMTAuthenticationRequest()
	if err != nil {
		return err
	}

	_, err = service.createCIRAConfig(token.Token)
	if err != nil {
		return err
	}

	return nil
}