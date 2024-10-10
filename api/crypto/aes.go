package crypto

import (
	"bufio"
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"fmt"
	"io"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/scrypt"
)

const (
	// AES GCM settings
	aesGcmHeader    = "AES256-GCM" // The encrypted file header
	aesGcmBlockSize = 1024 * 1024  // 1MB block for aes gcm

	// Argon2 settings
	// Recommded settings lower memory hardware according to current OWASP recommendations
	// Considering some people run portainer on a NAS I think it's prudent not to assume we're on server grade hardware
	// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id
	argon2MemoryCost = 12 * 1024
	argon2TimeCost   = 3
	argon2Threads    = 1
	argon2KeyLength  = 32
)

// AesEncrypt reads from input, encrypts with AES-256 and writes to output. passphrase is used to generate an encryption key
func AesEncrypt(input io.Reader, output io.Writer, passphrase []byte) error {
	if err := aesEncryptGCM(input, output, passphrase); err != nil {
		return fmt.Errorf("error encrypting file: %w", err)
	}

	return nil
}

// AesDecrypt reads from input, decrypts with AES-256 and returns the reader to read the decrypted content from
func AesDecrypt(input io.Reader, passphrase []byte) (io.Reader, error) {
	// Read file header to determine how it was encrypted
	inputReader := bufio.NewReader(input)
	header, err := inputReader.Peek(len(aesGcmHeader))
	if err != nil {
		return nil, fmt.Errorf("error reading encrypted backup file header: %w", err)
	}

	if string(header) == aesGcmHeader {
		reader, err := aesDecryptGCM(inputReader, passphrase)
		if err != nil {
			return nil, fmt.Errorf("error decrypting file: %w", err)
		}

		return reader, nil
	}

	// Use the previous decryption routine which has no header (to support older archives)
	reader, err := aesDecryptOFB(inputReader, passphrase)
	if err != nil {
		return nil, fmt.Errorf("error decrypting legacy file backup: %w", err)
	}

	return reader, nil
}

// aesEncryptGCM reads from input, encrypts with AES-256 and writes to output. passphrase is used to generate an encryption key.
func aesEncryptGCM(input io.Reader, output io.Writer, passphrase []byte) error {
	// Derive key using argon2 with a random salt
	salt := make([]byte, 16) // 16 bytes salt
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return err
	}

	key := argon2.IDKey(passphrase, salt, argon2TimeCost, argon2MemoryCost, argon2Threads, 32)
	block, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return err
	}

	// Generate nonce
	nonce, err := NewRandomNonce(aesgcm.NonceSize())
	if err != nil {
		return err
	}

	// write the header
	if _, err := output.Write([]byte(aesGcmHeader)); err != nil {
		return err
	}

	// Write nonce and salt to the output file
	if _, err := output.Write(salt); err != nil {
		return err
	}
	if _, err := output.Write(nonce.Value()); err != nil {
		return err
	}

	// Buffer for reading plaintext blocks
	buf := make([]byte, aesGcmBlockSize) // Adjust buffer size as needed
	ciphertext := make([]byte, len(buf)+aesgcm.Overhead())

	// Encrypt plaintext in blocks
	for {
		n, err := io.ReadFull(input, buf)
		if n == 0 {
			break // end of plaintext input
		}

		if err != nil && !(errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF)) {
			return err
		}

		// Seal encrypts the plaintext using the nonce returning the updated slice.
		ciphertext = aesgcm.Seal(ciphertext[:0], nonce.Value(), buf[:n], nil)

		_, err = output.Write(ciphertext)
		if err != nil {
			return err
		}

		nonce.Increment()
	}

	return nil
}

// aesDecryptGCM reads from input, decrypts with AES-256 and returns the reader to read the decrypted content from.
func aesDecryptGCM(input io.Reader, passphrase []byte) (io.Reader, error) {
	// Reader & verify header
	header := make([]byte, len(aesGcmHeader))
	if _, err := io.ReadFull(input, header); err != nil {
		return nil, err
	}

	if string(header) != aesGcmHeader {
		return nil, errors.New("invalid header")
	}

	// Read salt
	salt := make([]byte, 16) // Salt size
	if _, err := io.ReadFull(input, salt); err != nil {
		return nil, err
	}

	key := argon2.IDKey(passphrase, salt, argon2TimeCost, argon2MemoryCost, argon2Threads, 32)

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
	nonce := NewNonce(aesgcm.NonceSize())
	if err := nonce.Read(input); err != nil {
		return nil, err
	}

	// Initialize a buffer to store decrypted data
	buf := bytes.Buffer{}
	plaintext := make([]byte, aesGcmBlockSize)

	// Decrypt the ciphertext in blocks
	for {
		// Read a block of ciphertext from the input reader
		ciphertextBlock := make([]byte, aesGcmBlockSize+aesgcm.Overhead()) // Adjust block size as needed
		n, err := io.ReadFull(input, ciphertextBlock)
		if n == 0 {
			break // end of ciphertext
		}

		if err != nil && !(errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF)) {
			return nil, err
		}

		// Decrypt the block of ciphertext
		plaintext, err = aesgcm.Open(plaintext[:0], nonce.Value(), ciphertextBlock[:n], nil)
		if err != nil {
			return nil, err
		}

		if _, err := buf.Write(plaintext); err != nil {
			return nil, err
		}

		nonce.Increment()
	}

	return &buf, nil
}

// aesDecryptOFB reads from input, decrypts with AES-256 and returns the reader to a read decrypted content from.
// passphrase is used to generate an encryption key.
// note: This function used to decrypt files that were encrypted without a header i.e. old archives
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
