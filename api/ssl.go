package main

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"log"
)

// newTLSConfig initializes a tls.Config using a CA certificate, a certificate and a key
func newTLSConfig(caCertPath, certPath, keyPath string) *tls.Config {
	cert, err := tls.LoadX509KeyPair(certPath, keyPath)
	if err != nil {
		log.Fatal(err)
	}
	caCert, err := ioutil.ReadFile(caCertPath)
	if err != nil {
		log.Fatal(err)
	}
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)
	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		RootCAs:      caCertPool,
	}
	return tlsConfig
}
