package libcrypto

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"math/big"
	"net"
	"os"
	"time"
)

// GenerateCertsForHost generates a self-signed certificate for host and saves them at certPath and keyPath
func GenerateCertsForHost(hostname, ip, certPath, keyPath string, expiry time.Time) error {
	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		return err
	}

	template := x509.Certificate{
		SerialNumber:          serialNumber,
		NotAfter:              expiry,
		NotBefore:             time.Now(),
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}

	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		return errors.New("Failed parsing host ip")
	}

	template.DNSNames = append(template.DNSNames, hostname)
	template.IPAddresses = append(template.IPAddresses, parsedIP)

	keyPair, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return err
	}

	encodedCert, err := x509.CreateCertificate(rand.Reader, &template, &template, &keyPair.PublicKey, keyPair)
	if err != nil {
		return err
	}

	err = createPEMEncodedFile(certPath, "CERTIFICATE", encodedCert)
	if err != nil {
		return err
	}

	key, err := x509.MarshalECPrivateKey(keyPair)
	if err != nil {
		return err
	}

	err = createPEMEncodedFile(keyPath, "EC PRIVATE KEY", key)
	if err != nil {
		return err
	}

	return nil
}

func createPEMEncodedFile(path, header string, data []byte) error {
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return err
	}
	defer file.Close()

	err = pem.Encode(file, &pem.Block{Type: header, Bytes: data})
	if err != nil {
		return err
	}

	return nil
}
