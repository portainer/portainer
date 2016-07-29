package main

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"log"
)

// newTLSConfig initializes a tls.Config from the TLS flags
func newTLSConfig(tlsFlags TLSFlags) *tls.Config {
	cert, err := tls.LoadX509KeyPair(tlsFlags.certPath, tlsFlags.keyPath)
	if err != nil {
		log.Fatal(err)
	}
	caCert, err := ioutil.ReadFile(tlsFlags.caPath)
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
