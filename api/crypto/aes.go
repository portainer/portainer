package crypto

import (
	"bufio"
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/portainer/portainer/pkg/fips"

	// Not allowed in FIPS mode
	"golang.org/x/crypto/argon2" //nolint:depguard
	"golang.org/x/crypto/scrypt" //nolint:depguard
)

const (
	// AES GCM settings
	aesGcmHeader    = "AES256-GCM" // The encrypted file header
	aesGcmBlockSize = 1024 * 1024  // 1MB block for aes gcm

	aesGcmFIPSHeader    = "FIPS-AES256-GCM"
	aesGcmFIPSBlockSize = 16 * 1024 * 1024 // 16MB block for aes gcm

	// Argon2 settings
	// Recommended settings lower memory hardware according to current OWASP recommendations
	// Considering some people run portainer on a NAS I think it's prudent not to assume we're on server grade hardware
	// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id
	argon2MemoryCost = 12 * 1024
	argon2TimeCost   = 3
	argon2Threads    = 1
	argon2KeyLength  = 32

	pbkdf2Iterations = 600_000 // use recommended iterations from https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2 a little overkill for this use
	pbkdf2SaltLength = 32
)

var (
	// ErrFIPSEncryptedFileInNonFIPSMode is returned when a file encrypted by a fips
	// enabled server is read while fips mode is disabled.
	ErrFIPSEncryptedFileInNonFIPSMode = errors.New("fips encrypted file detected but fips mode is not enabled")

	// ErrNonFIPSEncryptedFileInFIPSMode is returned when a file encrypted by a server
	// that was not in fips mode is read while fips mode is enabled.
	ErrNonFIPSEncryptedFileInFIPSMode = errors.New("fips mode is enabled but non-fips encrypted file detected")

	// ErrNonFIPSApprovedEncryptionInFIPSMode is returned when a file carries no known
	// encryption header while fips mode is enabled, meaning it is either unencrypted
	// or uses the legacy format. Neither is fips approved.
	ErrNonFIPSApprovedEncryptionInFIPSMode = errors.New("fips mode is enabled but the backup was not encrypted in a fips approved way")

	// ErrEncryptedFileTooShort is returned when the input is too short to hold any
	// encryption header, which no valid encrypted file is.
	ErrEncryptedFileTooShort = errors.New("encrypted file is too short to be valid")
)

// AesEncrypt reads from input, encrypts with AES-256 and writes to output. passphrase is used to generate an encryption key
func AesEncrypt(input io.Reader, output io.Writer, passphrase []byte) error {
	if fips.FIPSMode() {
		if err := aesEncryptGCMFIPS(input, output, passphrase); err != nil {
			return fmt.Errorf("error encrypting file: %w", err)
		}
	} else {
		if err := aesEncryptGCM(input, output, passphrase); err != nil {
			return fmt.Errorf("error encrypting file: %w", err)
		}
	}

	return nil
}

// AesDecrypt reads from input, decrypts with AES-256 and returns the reader to read the decrypted content from
func AesDecrypt(input io.Reader, passphrase []byte) (io.Reader, error) {
	return aesDecrypt(input, passphrase, fips.FIPSMode())
}

func aesDecrypt(input io.Reader, passphrase []byte, fipsMode bool) (io.Reader, error) {
	inputReader := bufio.NewReader(input)
	header, err := inputReader.Peek(len(aesGcmFIPSHeader))
	truncated := errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF)
	if err != nil && !truncated {
		return nil, fmt.Errorf("error reading encrypted backup file header: %w", err)
	}

	if strings.HasPrefix(string(header), aesGcmFIPSHeader) {
		if !fipsMode {
			return nil, ErrFIPSEncryptedFileInNonFIPSMode
		}

		reader, err := aesDecryptGCMFIPS(inputReader, passphrase)
		if err != nil {
			return nil, fmt.Errorf("error decrypting file: %w", err)
		}

		return reader, nil
	}

	if strings.HasPrefix(string(header), aesGcmHeader) {
		if fipsMode {
			return nil, ErrNonFIPSEncryptedFileInFIPSMode
		}

		reader, err := aesDecryptGCM(inputReader, passphrase)
		if err != nil {
			return nil, fmt.Errorf("error decrypting file: %w", err)
		}

		return reader, nil
	}

	if truncated {
		return nil, ErrEncryptedFileTooShort
	}

	// The legacy format uses scrypt and AES-OFB, neither of which is fips approved,
	// so it can only have been produced by a non-fips server. An unencrypted archive
	// also lands here, and is equally invalid in fips mode.
	if fipsMode {
		return nil, ErrNonFIPSApprovedEncryptionInFIPSMode
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

		if err != nil && !errors.Is(err, io.EOF) && !errors.Is(err, io.ErrUnexpectedEOF) {
			return err
		}

		// Seal encrypts the plaintext using the nonce returning the updated slice.
		ciphertext = aesgcm.Seal(ciphertext[:0], nonce.Value(), buf[:n], nil)

		if _, err := output.Write(ciphertext); err != nil {
			return err
		}

		if err := nonce.Increment(); err != nil {
			return err
		}
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

		if err != nil && !errors.Is(err, io.EOF) && !errors.Is(err, io.ErrUnexpectedEOF) {
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

		if err := nonce.Increment(); err != nil {
			return nil, err
		}
	}

	return &buf, nil
}

// aesEncryptGCMFIPS reads from input, encrypts with AES-256 in a fips compliant
// way and writes to output. passphrase is used to generate an encryption key.
func aesEncryptGCMFIPS(input io.Reader, output io.Writer, passphrase []byte) error {
	salt := make([]byte, pbkdf2SaltLength)
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return err
	}

	key, err := pbkdf2.Key(sha256.New, string(passphrase), salt, pbkdf2Iterations, 32)
	if err != nil {
		return fmt.Errorf("error deriving key: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	// write the header
	if _, err := output.Write([]byte(aesGcmFIPSHeader)); err != nil {
		return err
	}

	// Write nonce and salt to the output file
	if _, err := output.Write(salt); err != nil {
		return err
	}

	// Buffer for reading plaintext blocks
	buf := make([]byte, aesGcmFIPSBlockSize)

	// Encrypt plaintext in blocks
	for {
		// new random nonce for each block
		aesgcm, err := cipher.NewGCMWithRandomNonce(block)
		if err != nil {
			return fmt.Errorf("error creating gcm: %w", err)
		}

		n, err := io.ReadFull(input, buf)
		if n == 0 {
			break // end of plaintext input
		}

		if err != nil && !errors.Is(err, io.EOF) && !errors.Is(err, io.ErrUnexpectedEOF) {
			return err
		}

		// Seal encrypts the plaintext
		ciphertext := aesgcm.Seal(nil, nil, buf[:n], nil)

		if _, err := output.Write(ciphertext); err != nil {
			return err
		}
	}

	return nil
}

// aesDecryptGCMFIPS reads from input, decrypts with AES-256 in a fips compliant
// way and returns the reader to read the decrypted content from.
func aesDecryptGCMFIPS(input io.Reader, passphrase []byte) (io.Reader, error) {
	// Reader & verify header
	header := make([]byte, len(aesGcmFIPSHeader))
	if _, err := io.ReadFull(input, header); err != nil {
		return nil, err
	}

	if string(header) != aesGcmFIPSHeader {
		return nil, errors.New("invalid header")
	}

	// Read salt
	salt := make([]byte, pbkdf2SaltLength)
	if _, err := io.ReadFull(input, salt); err != nil {
		return nil, err
	}

	key, err := pbkdf2.Key(sha256.New, string(passphrase), salt, pbkdf2Iterations, 32)
	if err != nil {
		return nil, fmt.Errorf("error deriving key: %w", err)
	}

	// Initialize AES cipher block
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	// Initialize a buffer to store decrypted data
	buf := bytes.Buffer{}

	// Decrypt the ciphertext in blocks
	for {
		// Create GCM mode with the cipher block
		aesgcm, err := cipher.NewGCMWithRandomNonce(block)
		if err != nil {
			return nil, err
		}

		// Read a block of ciphertext from the input reader
		ciphertextBlock := make([]byte, aesGcmFIPSBlockSize+aesgcm.Overhead())
		n, err := io.ReadFull(input, ciphertextBlock)
		if n == 0 {
			break // end of ciphertext
		}

		if err != nil && !errors.Is(err, io.EOF) && !errors.Is(err, io.ErrUnexpectedEOF) {
			return nil, err
		}

		// Decrypt the block of ciphertext
		plaintext, err := aesgcm.Open(nil, nil, ciphertextBlock[:n], nil)
		if err != nil {
			return nil, err
		}

		if _, err := buf.Write(plaintext); err != nil {
			return nil, err
		}
	}

	return &buf, nil
}

// aesDecryptOFB reads from input, decrypts with AES-256 and returns the reader to a read decrypted content from.
// passphrase is used to generate an encryption key.
// note: This function used to decrypt files that were encrypted without a header i.e. old archives
func aesDecryptOFB(input io.Reader, passphrase []byte) (io.Reader, error) {
	// making a 32 bytes key that would correspond to AES-256
	// don't necessarily need a salt, so just kept in empty
	key, err := scrypt.Key(passphrase, nil, 32768, 8, 1, 32)
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

// HasEncryptedHeader checks if the data has an encrypted header, note that fips
// mode changes this behavior and so will only recognize data encrypted by the
// same mode (fips enabled or disabled)
func HasEncryptedHeader(data []byte) bool {
	return hasEncryptedHeader(data, fips.FIPSMode())
}

func hasEncryptedHeader(data []byte, fipsMode bool) bool {
	if fipsMode {
		return bytes.HasPrefix(data, []byte(aesGcmFIPSHeader))
	}

	return bytes.HasPrefix(data, []byte(aesGcmHeader))
}
