package libcrypto

import (
	"crypto/aes"
	"crypto/cipher"

	"github.com/portainer/portainer/pkg/fips"
)

// Encrypt encrypts data using 256-bit AES-GCM.  This both hides the content of
// the data and provides a check that it hasn't been altered. Output takes the
// form nonce|ciphertext|tag where '|' indicates concatenation.
// Creates a 32bit hash of the key before encrypting the data.
func Encrypt(data, key []byte) ([]byte, error) {
	return encrypt(data, key, fips.FIPSMode())
}

func encrypt(data, key []byte, fips bool) ([]byte, error) {
	var hashKey []byte
	if fips {
		hashKey = HashFromBytes(key)
	} else {
		hashKey = InsecureHash32Bytes(key)
	}

	block, err := aes.NewCipher(hashKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCMWithRandomNonce(block)
	if err != nil {
		return nil, err
	}

	return gcm.Seal(nil, nil, data, nil), nil
}
