package crypto

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"io"

	"golang.org/x/crypto/scrypt"
)

// AesEncrypt reads from input, encrypts with AES-256 and writes to output. passphrase is used to generate an encryption key.
// The encryption uses AES-256 in CTR mode.
// The decryption function supports the previous portainer backups which use OFB mode.  New archives
// will use CTR mode and have a header to indicate the encryption mode.

// The encrypted file header
const ctrHeader = "AES256-CTR"

func AesEncrypt(input io.Reader, output io.Writer, passphrase []byte) error {
	return AesEncryptCTR(input, output, passphrase)
}

func AesDecrypt(input io.Reader, passphrase []byte) (io.Reader, error) {
	// Read file metadata to determine how it was encrypted
	var buf bytes.Buffer
	tee := io.TeeReader(input, &buf)
	header := make([]byte, len(ctrHeader))
	_, err := tee.Read(header)
	if err != nil {
		return nil, err
	}

	if string(header) == ctrHeader {
		return AesDecryptCTR(tee, passphrase)
	}

	// For backward compatibility. Read previous encrypted archives that have no header
	return AesDecryptOFB(&buf, passphrase)
}

func AesEncryptCTR(input io.Reader, output io.Writer, passphrase []byte) error {
	// Generate a random salt
	salt := make([]byte, 16)
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return err
	}

	// Generate a random initial value
	iv := make([]byte, aes.BlockSize)
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return err
	}

	// Derive encryption key from passphrase using scrypt
	key, err := scrypt.Key(passphrase, salt, 32768, 8, 1, 32)
	if err != nil {
		return err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	// Write header, salt and initial value to output
	if _, err := io.WriteString(output, ctrHeader); err != nil {
		return err
	}

	if _, err := output.Write(salt); err != nil {
		return err
	}

	if _, err := output.Write(iv); err != nil {
		return err
	}

	// Create a cipher stream
	stream := cipher.NewCTR(block, iv)

	// Create a writer that encrypts data using the cipher stream and writes to the output
	writer := &cipher.StreamWriter{S: stream, W: output}

	// Encrypt and write data to the output
	if _, err := io.Copy(writer, input); err != nil {
		return err
	}

	return nil
}

func AesDecryptCTR(input io.Reader, passphrase []byte) (io.Reader, error) {
	// Read salt from input
	salt := make([]byte, 16)
	if _, err := io.ReadFull(input, salt); err != nil {
		return nil, err
	}

	// Read IV from input
	iv := make([]byte, aes.BlockSize)
	if _, err := io.ReadFull(input, iv); err != nil {
		return nil, err
	}

	// Derive encryption key from passphrase and salt using scrypt
	key, err := scrypt.Key(passphrase, salt, 32768, 8, 1, 32)
	if err != nil {
		return nil, err
	}

	// Create AES cipher block
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	// Create a cipher stream
	stream := cipher.NewCTR(block, iv)
	reader := &cipher.StreamReader{S: stream, R: input}

	return reader, nil
}

// AesDecrypt reads from input, decrypts with AES-256 and returns the reader to a read decrypted content from.
// passphrase is used to generate an encryption key.
func AesDecryptOFB(input io.Reader, passphrase []byte) (io.Reader, error) {
	var emptySalt []byte = make([]byte, 0)

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

	// If the key is unique for each ciphertext, then it's ok to use a zero IV.
	var iv [aes.BlockSize]byte
	stream := cipher.NewOFB(block, iv[:])
	reader := &cipher.StreamReader{S: stream, R: input}

	return reader, nil
}
