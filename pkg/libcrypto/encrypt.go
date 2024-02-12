package libcrypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"io"
)

// Encrypt encrypts data using 256-bit AES-GCM.  This both hides the content of
// the data and provides a check that it hasn't been altered. Output takes the
// form nonce|ciphertext|tag where '|' indicates concatenation.
// Creates a 32bit hash of the key before encrypting the data.
func Encrypt(data, key []byte) ([]byte, error) {
	hashKey := Hash32Bit(key)

	block, err := aes.NewCipher(hashKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	_, err = io.ReadFull(rand.Reader, nonce)
	if err != nil {
		return nil, err
	}

	return gcm.Seal(nonce, nonce, data, nil), nil
}
