package libcrypto

import (
	"crypto/aes"
	"crypto/cipher"
	"errors"

	"github.com/portainer/portainer/pkg/fips"
)

// Decrypt decrypts data using 256-bit AES-GCM.  This both hides the content of
// the data and provides a check that it hasn't been altered. Expects input
// form nonce|ciphertext|tag where '|' indicates concatenation.
// Creates a 32bit hash of the key before decrypting the data.
func Decrypt(data []byte, key []byte) ([]byte, error) {
	return decrypt(data, key, fips.FIPSMode())
}

func decrypt(data []byte, key []byte, fips bool) ([]byte, error) {
	var hashKey []byte
	if fips {
		// sha256 hash 32 bytes
		hashKey = HashFromBytes(key)
	} else {
		// 16 byte hash, hex encoded is 32 bytes
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

	if len(data) < gcm.NonceSize() {
		return nil, errors.New("malformed ciphertext")
	}

	return gcm.Open(nil,
		nil,
		data,
		nil,
	)
}
