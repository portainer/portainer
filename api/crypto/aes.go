package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"io"

	"golang.org/x/crypto/scrypt"
)

// NOTE: has to go with what is considered to be a simplistic in that it omits any
// authentication of the encrypted data.
// Person with better knowledge is welcomed to improve it.
// sourced from https://golang.org/src/crypto/cipher/example_test.go

var emptySalt []byte = make([]byte, 0, 0)

// AesEncrypt reads from input, encrypts with AES-256 and writes to the output.
// passphrase is used to generate an encryption key.
func AesEncrypt(input io.Reader, output io.Writer, passphrase []byte) error {
	// making a 32 bytes key that would correspond to AES-256
	// don't necessarily need a salt, so just kept in empty
	key, err := scrypt.Key(passphrase, emptySalt, 32768, 8, 1, 32)
	if err != nil {
		return err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	// If the key is unique for each ciphertext, then it's ok to use a zero
	// IV.
	var iv [aes.BlockSize]byte
	stream := cipher.NewOFB(block, iv[:])

	writer := &cipher.StreamWriter{S: stream, W: output}
	// Copy the input to the output, encrypting as we go.
	if _, err := io.Copy(writer, input); err != nil {
		return err
	}

	return nil
}

// AesDecrypt reads from input, decrypts with AES-256 and returns the reader to a read decrypted content from.
// passphrase is used to generate an encryption key.
func AesDecrypt(input io.Reader, passphrase []byte) (io.Reader, error) {
	// making a 32 bytes key that would correspond to AES-256
	// don't necessarily need a salt, so just kept in empty
	key, err := scrypt.Key(passphrase, emptySalt, 32768, 8, 1, 32)
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	// If the key is unique for each ciphertext, then it's ok to use a zero
	// IV.
	var iv [aes.BlockSize]byte
	stream := cipher.NewOFB(block, iv[:])

	reader := &cipher.StreamReader{S: stream, R: input}

	return reader, nil
}
