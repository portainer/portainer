package crypto

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"fmt"
	"io"

	"golang.org/x/crypto/scrypt"
)

// AesEncrypt reads from input, encrypts with AES-256 and writes to output. passphrase is used to generate an encryption key.
// The encryption uses AES-256 in GCM mode.
// The decryption function supports the previous portainer backups which use OFB mode.  New archives
// will use GCM mode and have a header to indicate the encryption mode.
// GCM is currently considered the most secure mode for AES encryption (2024)

// The encrypted file header
const (
	gcmHeader = "AES256-GCM"
	blockSize = 4096
)

func AesEncrypt(input io.Reader, output io.Writer, passphrase []byte) error {
	return aesEncryptGCM(input, output, passphrase)
}

func AesDecrypt(input io.Reader, passphrase []byte) (io.Reader, error) {
	// Read file metadata to determine how it was encrypted
	var buf bytes.Buffer
	tee := io.TeeReader(input, &buf)
	header := make([]byte, len(gcmHeader))
	_, err := tee.Read(header)
	if err != nil {
		return nil, err
	}

	if string(header) == gcmHeader {
		fmt.Println("Decrypt: GCM mode")
		return aesDecryptGCM(tee, passphrase)
	}

	fmt.Println("Decrypt: OFB mode")
	// For backward compatibility. Read previous encrypted archives that have no header
	return aesDecryptOFB(&buf, passphrase)
}

func aesEncryptGCM(input io.Reader, output io.Writer, passphrase []byte) error {
	// Derive key using scrypt with a random salt
	salt := make([]byte, 16) // 16 bytes salt
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return err
	}

	key, err := scrypt.Key(passphrase, salt, 32768, 8, 1, 32) // 32 bytes key
	if err != nil {
		return err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return err
	}

	// Generate nonce
	nonce, err := NewRandom(12, 4)
	if err != nil {
		return err
	}

	// write the header
	if _, err := output.Write([]byte(gcmHeader)); err != nil {
		return err
	}

	// Write nonce and salt to the output file
	if _, err := output.Write(salt); err != nil {
		return err
	}
	if _, err := output.Write(nonce.Value()); err != nil {
		return err
	}

	fmt.Printf("Encrypt: salt: %x\n", salt)
	fmt.Printf("Encrypt: nonce: %x\n", nonce.Value())

	// Buffer for reading plaintext blocks
	buf := make([]byte, 4096) // Adjust buffer size as needed

	// Encrypt plaintext in blocks
	for {
		n, err := input.Read(buf)
		if err != nil && err != io.EOF {
			return err
		}
		if n == 0 {
			break // Reached end of plaintext
		}

		// Seal encrypts the plaintext using the nonce and appends the result to dst,
		// returning the updated slice.
		ciphertext := aesgcm.Seal(nil, nonce.Value(), buf[:n], nil)
		nonce.Increment()

		// Write ciphertext to output
		if _, err := output.Write(ciphertext); err != nil {
			return err
		}
	}

	return nil
}

func aesDecryptGCM(input io.Reader, passphrase []byte) (io.Reader, error) {
	// Read salt
	salt := make([]byte, 16) // Salt size
	if _, err := io.ReadFull(input, salt); err != nil {
		return nil, err
	}

	// Derive key using scrypt with the provided passphrase and salt
	key, err := scrypt.Key(passphrase, salt, 32768, 8, 1, 32) // 32 bytes key
	if err != nil {
		return nil, err
	}

	// Initialize AES cipher block
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	// Create GCM mode with the cipher block
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	// Read nonce from the input reader
	nonce := New(aesgcm.NonceSize())
	if err := nonce.ReadValue(input); err != nil {
		return nil, err
	}

	// Initialize a buffer to store decrypted data
	buf := bytes.Buffer{}

	// Decrypt the ciphertext in blocks
	for {
		// Read a block of ciphertext from the input reader
		ciphertextBlock := make([]byte, 4096) // Adjust block size as needed
		n, err := input.Read(ciphertextBlock)
		if err != nil && !errors.Is(err, io.EOF) {
			return nil, err
		}
		if n == 0 {
			break // Reached end of ciphertext
		}

		// Decrypt the block of ciphertext
		plaintext, err := aesgcm.Open(nil, nonce.Value(), ciphertextBlock[:n], nil)
		if err != nil {
			return nil, fmt.Errorf("error decrypting block: %w", err)
		}

		nonce.Increment()

		// Write the decrypted plaintext to the buffer
		if _, err := buf.Write(plaintext); err != nil {
			return nil, err
		}
	}

	return &buf, nil
}

// aesDecryptOFB reads from input, decrypts with AES-256 and returns the reader to a read decrypted content from.
// passphrase is used to generate an encryption key.
func aesDecryptOFB(input io.Reader, passphrase []byte) (io.Reader, error) {
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
