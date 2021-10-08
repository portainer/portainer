package crypto

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"math/big"

	"github.com/portainer/libcrypto"
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
// an agent based environment(endpoint). It will automatically generates a key pair using ECDSA or
// can also reuse an existing ECDSA key pair.
type ECDSAService struct {
	privateKey    *ecdsa.PrivateKey
	publicKey     *ecdsa.PublicKey
	encodedPubKey string
	secret        string
}

// NewECDSAService returns a pointer to a ECDSAService.
// An optional secret can be specified
func NewECDSAService(secret string) *ECDSAService {
	return &ECDSAService{
		secret: secret,
	}
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

// CreateSignature creates a digital signature.
// It automatically hash a specific message using MD5 and creates a signature from
// that hash.
// If a secret is associated to the service, it will be used instead of the specified
// message.
// It then encodes the generated signature in base64.
func (service *ECDSAService) CreateSignature(message string) (string, error) {
	if service.secret != "" {
		message = service.secret
	}

	hash := libcrypto.HashFromBytes([]byte(message))

	r := big.NewInt(0)
	s := big.NewInt(0)

	r, s, err := ecdsa.Sign(rand.Reader, service.privateKey, hash)
	if err != nil {
		return "", err
	}

	keyBytes := service.privateKey.Params().BitSize / 8

	rBytes := r.Bytes()
	rBytesPadded := make([]byte, keyBytes)
	copy(rBytesPadded[keyBytes-len(rBytes):], rBytes)

	sBytes := s.Bytes()
	sBytesPadded := make([]byte, keyBytes)
	copy(sBytesPadded[keyBytes-len(sBytes):], sBytes)

	signature := append(rBytesPadded, sBytesPadded...)

	return base64.RawStdEncoding.EncodeToString(signature), nil
}
