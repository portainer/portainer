package crypto

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/md5"
	"crypto/rand"
	"crypto/x509"
	"encoding/hex"
	"fmt"
	"math/big"
)

const (
	// PrivateKeyPemHeader represents the header that is appended to the PEM file when
	// storing the private key.
	PrivateKeyPemHeader = "EC PRIVATE KEY"
	// PublicKeyPemHeader represents the header that is appended to the PEM file when
	// storing the public key.
	PublicKeyPemHeader = "ECDSA PUBLIC KEY"
)

// ECDSAService is a service used to create digital signatures when communicating with
// an agent based environment. It will automatically generates a key pair using ECDSA or
// can also reuse an existing ECDSA key pair.
type ECDSAService struct {
	privateKey    *ecdsa.PrivateKey
	publicKey     *ecdsa.PublicKey
	encodedPubKey string
}

// EncodedPublicKey returns the encoded version of the public that can be used
// to be shared with other services. It's the hexadecimal encoding of the public key
// content.
func (service *ECDSAService) EncodedPublicKey() string {
	return service.encodedPubKey
}

// PEMHeaders returns the ECDSA PEM headers.
func (service *ECDSAService) PEMHeaders() (string, string) {
	return PrivateKeyPemHeader, PublicKeyPemHeader
}

// ParseKeyPair parses existing private/public key pair content and associate
// the parsed keys to the service.
func (service *ECDSAService) ParseKeyPair(private, public []byte) error {
	privateKey, err := x509.ParseECPrivateKey(private)
	if err != nil {
		return err
	}

	service.privateKey = privateKey

	encodedKey := hex.EncodeToString(public)
	service.encodedPubKey = encodedKey

	publicKey, err := x509.ParsePKIXPublicKey(public)
	if err != nil {
		return err
	}

	service.publicKey = publicKey.(*ecdsa.PublicKey)

	return nil
}

// GenerateKeyPair will create a new key pair using ECDSA.
func (service *ECDSAService) GenerateKeyPair() ([]byte, []byte, error) {
	pubkeyCurve := elliptic.P256()

	privatekey, err := ecdsa.GenerateKey(pubkeyCurve, rand.Reader)
	if err != nil {
		return nil, nil, err
	}

	service.privateKey = privatekey
	service.publicKey = &privatekey.PublicKey

	private, err := x509.MarshalECPrivateKey(service.privateKey)
	if err != nil {
		return nil, nil, err
	}

	public, err := x509.MarshalPKIXPublicKey(service.publicKey)
	if err != nil {
		return nil, nil, err
	}

	encodedKey := hex.EncodeToString(public)
	service.encodedPubKey = encodedKey

	return private, public, nil
}

// Sign creates a signature from a message.
// It automatically hash the message using MD5 and creates a signature from
// that hash.
func (service *ECDSAService) Sign(message string) ([]byte, error) {
	hasher := md5.New()
	hasher.Write([]byte(message))
	hash := fmt.Sprintf("%x", hasher.Sum(nil))

	r := big.NewInt(0)
	s := big.NewInt(0)

	r, s, err := ecdsa.Sign(rand.Reader, service.privateKey, []byte(hash))
	if err != nil {
		return nil, err
	}

	signature := r.Bytes()
	signature = append(signature, s.Bytes()...)

	return signature, nil
}
