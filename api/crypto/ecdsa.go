package crypto

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/hex"
	"log"
	"math/big"
)

const (
	PrivateKeyPemHeader = "EC PRIVATE KEY"
	PublicKeyPemHeader  = "ECDSA PUBLIC KEY"
)

type ECDSAService struct {
	privateKey *ecdsa.PrivateKey
	publicKey  *ecdsa.PublicKey
}

func (service *ECDSAService) PEMHeaders() (string, string) {
	return PrivateKeyPemHeader, PublicKeyPemHeader
}

func (service *ECDSAService) ParseKeyPair(private, public []byte) error {
	privateKey, err := x509.ParseECPrivateKey(private)
	if err != nil {
		return err
	}

	service.privateKey = privateKey

	encodedKey := hex.EncodeToString(public)
	log.Printf("Portainer public key: %s", encodedKey)

	publicKey, err := x509.ParsePKIXPublicKey(public)
	if err != nil {
		return err
	}

	service.publicKey = publicKey.(*ecdsa.PublicKey)

	return nil
}

func (service *ECDSAService) GenerateKeyPair() ([]byte, []byte, error) {
	// TODO: check best practices
	pubkeyCurve := elliptic.P256() //see http://golang.org/pkg/crypto/elliptic/#P256

	privatekey := new(ecdsa.PrivateKey)
	privatekey, err := ecdsa.GenerateKey(pubkeyCurve, rand.Reader)
	if err != nil {
		return nil, nil, err
	}

	service.privateKey = privatekey

	var publicKey ecdsa.PublicKey
	publicKey = privatekey.PublicKey
	service.publicKey = &publicKey

	private, err := x509.MarshalECPrivateKey(service.privateKey)
	if err != nil {
		return nil, nil, err
	}

	public, err := x509.MarshalPKIXPublicKey(&publicKey)
	if err != nil {
		return nil, nil, err
	}

	encodedKey := hex.EncodeToString(public)
	log.Printf("Portainer public key: %s", encodedKey)

	return private, public, nil
}

func (service *ECDSAService) Sign(hash []byte) ([]byte, error) {

	r := big.NewInt(0)
	s := big.NewInt(0)

	r, s, err := ecdsa.Sign(rand.Reader, service.privateKey, hash)
	if err != nil {
		return nil, err
	}

	signature := r.Bytes()
	signature = append(signature, s.Bytes()...)

	return signature, nil
}
