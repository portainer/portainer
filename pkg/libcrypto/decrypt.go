package libcrypto

import (
	"crypto/aes"
	"crypto/cipher"
	"errors"
)

// Decrypt decrypts data using 256-bit AES-GCM.  This both hides the content of
// the data and provides a check that it hasn't been altered. Expects input
// form nonce|ciphertext|tag where '|' indicates concatenation.
// Creates a 32bit hash of the key before decrypting the data.
func Decrypt(data []byte, key []byte) ([]byte, error) {
	hashKey := Hash32Bit(key)

	block, err := aes.NewCipher(hashKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	if len(data) < gcm.NonceSize() {
		return nil, errors.New("malformed ciphertext")
	}

	return gcm.Open(nil,
		data[:gcm.NonceSize()],
		data[gcm.NonceSize():],
		nil,
	)
}
