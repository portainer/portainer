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

// TODO: persist keypair
type ECDSAService struct {
	privateKey *ecdsa.PrivateKey
	publicKey  *ecdsa.PublicKey
}

func (service *ECDSAService) GenerateKeyPair() error {
	// TODO: check best practices
	pubkeyCurve := elliptic.P256() //see http://golang.org/pkg/crypto/elliptic/#P256

	privatekey := new(ecdsa.PrivateKey)
	privatekey, err := ecdsa.GenerateKey(pubkeyCurve, rand.Reader)
	if err != nil {
		return err
	}
	service.privateKey = privatekey

	var publicKey ecdsa.PublicKey
	publicKey = privatekey.PublicKey
	service.publicKey = &publicKey

	x509EncodedPub, err := x509.MarshalPKIXPublicKey(&publicKey)
	if err != nil {
		return err
	}

	encodedKey := hex.EncodeToString(x509EncodedPub)
	log.Printf("Portainer public key: %s", encodedKey)
	return nil
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
