package main

import (
	"crypto/tls"
	"errors"
	"github.com/gorilla/securecookie"
	"log"
	"net/http"
	"net/url"
)

type (
	api struct {
		endpoint     *url.URL
		bindAddress  string
		assetPath    string
		dataPath     string
		tlsConfig    *tls.Config
		templatesURL string
		dataStore    *dataStore
		secret       []byte
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
		TemplatesURL  string
	}
)

const (
	datastoreFileName = "portainer.db"
)

var (
	errSecretKeyGeneration = errors.New("Unable to generate secret key to sign JWT")
)

func (a *api) run(settings *Settings) {
	err := a.initDatabase()
	if err != nil {
		log.Fatal(err)
	}
	defer a.cleanUp()

	handler := a.newHandler(settings)
	log.Printf("Starting portainer on %s", a.bindAddress)
	if err := http.ListenAndServe(a.bindAddress, handler); err != nil {
		log.Fatal(err)
	}
}

func (a *api) cleanUp() {
	a.dataStore.cleanUp()
}

func (a *api) initDatabase() error {
	dataStore, err := newDataStore(a.dataPath + "/" + datastoreFileName)
	if err != nil {
		return err
	}
	err = dataStore.initDataStore()
	if err != nil {
		return err
	}
	a.dataStore = dataStore
	return nil
}

func newAPI(apiConfig apiConfig) *api {
	endpointURL, err := url.Parse(apiConfig.Endpoint)
	if err != nil {
		log.Fatal(err)
	}

	secret := securecookie.GenerateRandomKey(32)
	if secret == nil {
		log.Fatal(errSecretKeyGeneration)
	}

	var tlsConfig *tls.Config
	if apiConfig.TLSEnabled {
		tlsConfig = newTLSConfig(apiConfig.TLSCACertPath, apiConfig.TLSCertPath, apiConfig.TLSKeyPath)
	}

	return &api{
		endpoint:     endpointURL,
		bindAddress:  apiConfig.BindAddress,
		assetPath:    apiConfig.AssetPath,
		dataPath:     apiConfig.DataPath,
		tlsConfig:    tlsConfig,
		templatesURL: apiConfig.TemplatesURL,
		secret:       secret,
	}
}
