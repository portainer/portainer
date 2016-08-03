package main

import (
	"crypto/tls"
	"log"
	"net/http"
	"net/url"
)

type (
	api struct {
		endpoint    *url.URL
		bindAddress string
		assetPath   string
		dataPath    string
		tlsConfig   *tls.Config
	}

	apiConfig struct {
		Endpoint      string
		BindAddress   string
		AssetPath     string
		DataPath      string
		SwarmSupport  bool
		TLSEnabled    bool
		TLSCACertPath string
		TLSCertPath   string
		TLSKeyPath    string
	}
)

func (a *api) run(configuration *Config) {
	handler := a.newHandler(configuration)
	if err := http.ListenAndServe(a.bindAddress, handler); err != nil {
		log.Fatal(err)
	}
}

func newAPI(apiConfig apiConfig) *api {
	endpointURL, err := url.Parse(apiConfig.Endpoint)
	if err != nil {
		log.Fatal(err)
	}

	var tlsConfig *tls.Config
	if apiConfig.TLSEnabled {
		tlsConfig = newTLSConfig(apiConfig.TLSCACertPath, apiConfig.TLSCertPath, apiConfig.TLSKeyPath)
	}

	return &api{
		endpoint:    endpointURL,
		bindAddress: apiConfig.BindAddress,
		assetPath:   apiConfig.AssetPath,
		dataPath:    apiConfig.DataPath,
		tlsConfig:   tlsConfig,
	}
}
