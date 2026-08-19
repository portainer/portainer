package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"io"
	"math/rand"
	"os"
	"testing"

	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/pkg/fips"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/scrypt"
)

func init() {
	fips.InitFIPS(false)
}

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func randBytes(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}

	return b
}

type encryptFunc func(input io.Reader, output io.Writer, passphrase []byte) error
type decryptFunc func(input io.Reader, passphrase []byte) (io.Reader, error)

func Test_encryptAndDecrypt_withTheSamePassword(t *testing.T) {
	const passphrase = "passphrase"

	testFunc := func(t *testing.T, encrypt encryptFunc, decrypt decryptFunc, decryptShouldSucceed bool) {
		tmpdir := t.TempDir()

		var (
			originFilePath    = filesystem.JoinPaths(tmpdir, "origin")
			encryptedFilePath = filesystem.JoinPaths(tmpdir, "encrypted")
			decryptedFilePath = filesystem.JoinPaths(tmpdir, "decrypted")
		)

		content := randBytes(1024*1024*100 + 523)
		err := os.WriteFile(originFilePath, content, 0600)
		require.NoError(t, err)

		originFile, _ := os.Open(originFilePath)
		defer logs.CloseAndLogErr(originFile)

		encryptedFileWriter, _ := os.Create(encryptedFilePath)

		err = encrypt(originFile, encryptedFileWriter, []byte(passphrase))
		require.NoError(t, err, "Failed to encrypt a file")
		logs.CloseAndLogErr(encryptedFileWriter)

		encryptedContent, err := os.ReadFile(encryptedFilePath)
		require.NoError(t, err, "Couldn't read encrypted file")
		assert.NotEqual(t, encryptedContent, content, "Content wasn't encrypted")

		encryptedFileReader, err := os.Open(encryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(encryptedFileReader)

		decryptedFileWriter, err := os.Create(decryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(decryptedFileWriter)

		decryptedReader, err := decrypt(encryptedFileReader, []byte(passphrase))
		if !decryptShouldSucceed {
			require.Error(t, err, "Failed to decrypt file as indicated by decryptShouldSucceed")
		} else {
			require.NoError(t, err, "Failed to decrypt file indicated by decryptShouldSucceed")

			_, err = io.Copy(decryptedFileWriter, decryptedReader)
			require.NoError(t, err)

			decryptedContent, err := os.ReadFile(decryptedFilePath)
			require.NoError(t, err)
			assert.Equal(t, content, decryptedContent, "Original and decrypted content should match")
		}
	}

	t.Run("fips", func(t *testing.T) {
		testFunc(t, aesEncryptGCMFIPS, aesDecryptGCMFIPS, true)
	})

	t.Run("non_fips", func(t *testing.T) {
		testFunc(t, aesEncryptGCM, aesDecryptGCM, true)
	})

	t.Run("system_fips_mode_public_entry_points", func(t *testing.T) {
		// use the init mode, public entry points
		testFunc(t, AesEncrypt, AesDecrypt, true)
	})

	t.Run("fips_encrypted_file_header_fails_in_non_fips_mode", func(t *testing.T) {
		// use aesDecrypt which checks the header, confirm that it fails
		decrypt := func(input io.Reader, passphrase []byte) (io.Reader, error) {
			return aesDecrypt(input, passphrase, false)
		}

		testFunc(t, aesEncryptGCMFIPS, decrypt, false)
	})

	t.Run("non_fips_encrypted_file_header_fails_in_fips_mode", func(t *testing.T) {
		// use aesDecrypt which checks the header, confirm that it fails
		decrypt := func(input io.Reader, passphrase []byte) (io.Reader, error) {
			return aesDecrypt(input, passphrase, true)
		}

		testFunc(t, aesEncryptGCM, decrypt, false)
	})

	t.Run("fips_encrypted_file_fails_in_non_fips_mode", func(t *testing.T) {
		testFunc(t, aesEncryptGCMFIPS, aesDecryptGCM, false)
	})

	t.Run("non_fips_encrypted_file_with_fips_mode_should_fail", func(t *testing.T) {
		testFunc(t, aesEncryptGCM, aesDecryptGCMFIPS, false)
	})

	t.Run("fips_with_base_aesDecrypt", func(t *testing.T) {
		// maximize coverage, use the base aesDecrypt function with valid fips mode
		decrypt := func(input io.Reader, passphrase []byte) (io.Reader, error) {
			return aesDecrypt(input, passphrase, true)
		}

		testFunc(t, aesEncryptGCMFIPS, decrypt, true)
	})

	t.Run("legacy", func(t *testing.T) {
		testFunc(t, legacyAesEncrypt, aesDecryptOFB, true)
	})
}

func Test_encryptAndDecrypt_withStrongPassphrase(t *testing.T) {
	t.Parallel()
	const passphrase = "A strong passphrase with special characters: !@#$%^&*()_+"

	testFunc := func(t *testing.T, encrypt encryptFunc, decrypt decryptFunc) {
		tmpdir := t.TempDir()

		var (
			originFilePath    = filesystem.JoinPaths(tmpdir, "origin2")
			encryptedFilePath = filesystem.JoinPaths(tmpdir, "encrypted2")
			decryptedFilePath = filesystem.JoinPaths(tmpdir, "decrypted2")
		)

		content := randBytes(500)

		err := os.WriteFile(originFilePath, content, 0600)
		require.NoError(t, err)

		originFile, err := os.Open(originFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(originFile)

		encryptedFileWriter, _ := os.Create(encryptedFilePath)

		err = encrypt(originFile, encryptedFileWriter, []byte(passphrase))
		require.NoError(t, err, "Failed to encrypt a file")
		logs.CloseAndLogErr(encryptedFileWriter)

		encryptedContent, err := os.ReadFile(encryptedFilePath)
		require.NoError(t, err, "Couldn't read encrypted file")
		assert.NotEqual(t, encryptedContent, content, "Content wasn't encrypted")

		encryptedFileReader, err := os.Open(encryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(encryptedFileReader)

		decryptedFileWriter, err := os.Create(decryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(decryptedFileWriter)

		decryptedReader, err := decrypt(encryptedFileReader, []byte(passphrase))
		require.NoError(t, err, "Failed to decrypt file")

		_, err = io.Copy(decryptedFileWriter, decryptedReader)
		require.NoError(t, err)

		decryptedContent, err := os.ReadFile(decryptedFilePath)
		require.NoError(t, err)
		assert.Equal(t, content, decryptedContent, "Original and decrypted content should match")
	}

	t.Run("fips", func(t *testing.T) {
		testFunc(t, aesEncryptGCMFIPS, aesDecryptGCMFIPS)
	})

	t.Run("non_fips", func(t *testing.T) {
		testFunc(t, aesEncryptGCM, aesDecryptGCM)
	})
}

func Test_encryptAndDecrypt_withTheSamePasswordSmallFile(t *testing.T) {
	t.Parallel()
	testFunc := func(t *testing.T, encrypt encryptFunc, decrypt decryptFunc) {
		tmpdir := t.TempDir()

		var (
			originFilePath    = filesystem.JoinPaths(tmpdir, "origin2")
			encryptedFilePath = filesystem.JoinPaths(tmpdir, "encrypted2")
			decryptedFilePath = filesystem.JoinPaths(tmpdir, "decrypted2")
		)

		content := randBytes(500)
		err := os.WriteFile(originFilePath, content, 0600)
		require.NoError(t, err)

		originFile, err := os.Open(originFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(originFile)

		encryptedFileWriter, err := os.Create(encryptedFilePath)
		require.NoError(t, err)

		err = encrypt(originFile, encryptedFileWriter, []byte("passphrase"))
		require.NoError(t, err, "Failed to encrypt a file")
		logs.CloseAndLogErr(encryptedFileWriter)

		encryptedContent, err := os.ReadFile(encryptedFilePath)
		require.NoError(t, err, "Couldn't read encrypted file")
		assert.NotEqual(t, encryptedContent, content, "Content wasn't encrypted")

		encryptedFileReader, err := os.Open(encryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(encryptedFileReader)

		decryptedFileWriter, err := os.Create(decryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(decryptedFileWriter)

		decryptedReader, err := decrypt(encryptedFileReader, []byte("passphrase"))
		require.NoError(t, err, "Failed to decrypt file")

		_, err = io.Copy(decryptedFileWriter, decryptedReader)
		require.NoError(t, err)

		decryptedContent, err := os.ReadFile(decryptedFilePath)
		require.NoError(t, err)
		assert.Equal(t, content, decryptedContent, "Original and decrypted content should match")
	}

	t.Run("fips", func(t *testing.T) {
		testFunc(t, aesEncryptGCMFIPS, aesDecryptGCMFIPS)
	})

	t.Run("non_fips", func(t *testing.T) {
		testFunc(t, aesEncryptGCM, aesDecryptGCM)
	})
}

func Test_encryptAndDecrypt_withEmptyPassword(t *testing.T) {
	t.Parallel()
	testFunc := func(t *testing.T, encrypt encryptFunc, decrypt decryptFunc) {
		tmpdir := t.TempDir()

		var (
			originFilePath    = filesystem.JoinPaths(tmpdir, "origin")
			encryptedFilePath = filesystem.JoinPaths(tmpdir, "encrypted")
			decryptedFilePath = filesystem.JoinPaths(tmpdir, "decrypted")
		)

		content := randBytes(1024 * 50)
		err := os.WriteFile(originFilePath, content, 0600)
		require.NoError(t, err)

		originFile, err := os.Open(originFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(originFile)

		encryptedFileWriter, err := os.Create(encryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(encryptedFileWriter)

		err = encrypt(originFile, encryptedFileWriter, []byte(""))
		require.NoError(t, err, "Failed to encrypt a file")

		encryptedContent, err := os.ReadFile(encryptedFilePath)
		require.NoError(t, err, "Couldn't read encrypted file")
		assert.NotEqual(t, encryptedContent, content, "Content wasn't encrypted")

		encryptedFileReader, err := os.Open(encryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(encryptedFileReader)

		decryptedFileWriter, err := os.Create(decryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(decryptedFileWriter)

		decryptedReader, err := decrypt(encryptedFileReader, []byte(""))
		require.NoError(t, err, "Failed to decrypt file")

		_, err = io.Copy(decryptedFileWriter, decryptedReader)
		require.NoError(t, err)

		decryptedContent, err := os.ReadFile(decryptedFilePath)
		require.NoError(t, err)
		assert.Equal(t, content, decryptedContent, "Original and decrypted content should match")
	}

	t.Run("fips", func(t *testing.T) {
		testFunc(t, aesEncryptGCMFIPS, aesDecryptGCMFIPS)
	})

	t.Run("non_fips", func(t *testing.T) {
		testFunc(t, aesEncryptGCM, aesDecryptGCM)
	})
}

func Test_decryptWithDifferentPassphrase_shouldProduceWrongResult(t *testing.T) {
	t.Parallel()
	testFunc := func(t *testing.T, encrypt encryptFunc, decrypt decryptFunc) {
		tmpdir := t.TempDir()

		var (
			originFilePath    = filesystem.JoinPaths(tmpdir, "origin")
			encryptedFilePath = filesystem.JoinPaths(tmpdir, "encrypted")
			decryptedFilePath = filesystem.JoinPaths(tmpdir, "decrypted")
		)

		content := randBytes(1034)
		err := os.WriteFile(originFilePath, content, 0600)
		require.NoError(t, err)

		originFile, err := os.Open(originFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(originFile)

		encryptedFileWriter, err := os.Create(encryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(encryptedFileWriter)

		err = encrypt(originFile, encryptedFileWriter, []byte("passphrase"))
		require.NoError(t, err, "Failed to encrypt a file")
		encryptedContent, err := os.ReadFile(encryptedFilePath)
		require.NoError(t, err, "Couldn't read encrypted file")
		assert.NotEqual(t, encryptedContent, content, "Content wasn't encrypted")

		encryptedFileReader, err := os.Open(encryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(encryptedFileReader)

		decryptedFileWriter, err := os.Create(decryptedFilePath)
		require.NoError(t, err)
		defer logs.CloseAndLogErr(decryptedFileWriter)

		_, err = decrypt(encryptedFileReader, []byte("garbage"))
		require.Error(t, err, "Should not allow decrypt with wrong passphrase")
	}

	t.Run("fips", func(t *testing.T) {
		testFunc(t, aesEncryptGCMFIPS, aesDecryptGCMFIPS)
	})

	t.Run("non_fips", func(t *testing.T) {
		testFunc(t, aesEncryptGCM, aesDecryptGCM)
	})
}

func legacyAesEncrypt(input io.Reader, output io.Writer, passphrase []byte) error {
	key, err := scrypt.Key(passphrase, nil, 32768, 8, 1, 32)
	if err != nil {
		return err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	var iv [aes.BlockSize]byte
	stream := cipher.NewOFB(block, iv[:])

	writer := &cipher.StreamWriter{S: stream, W: output}
	if _, err := io.Copy(writer, input); err != nil {
		return err
	}

	return nil
}

func Test_hasEncryptedHeader(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name     string
		data     []byte
		fipsMode bool
		want     bool
	}{
		{
			name:     "non-FIPS mode with valid header",
			data:     []byte("AES256-GCM" + "some encrypted data"),
			fipsMode: false,
			want:     true,
		},
		{
			name:     "non-FIPS mode with FIPS header",
			data:     []byte("FIPS-AES256-GCM" + "some encrypted data"),
			fipsMode: false,
			want:     false,
		},
		{
			name:     "FIPS mode with valid header",
			data:     []byte("FIPS-AES256-GCM" + "some encrypted data"),
			fipsMode: true,
			want:     true,
		},
		{
			name:     "FIPS mode with non-FIPS header",
			data:     []byte("AES256-GCM" + "some encrypted data"),
			fipsMode: true,
			want:     false,
		},
		{
			name:     "invalid header",
			data:     []byte("INVALID-HEADER" + "some data"),
			fipsMode: false,
			want:     false,
		},
		{
			name:     "empty data",
			data:     []byte{},
			fipsMode: false,
			want:     false,
		},
		{
			name:     "nil data",
			data:     nil,
			fipsMode: false,
			want:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := hasEncryptedHeader(tt.data, tt.fipsMode)
			assert.Equal(t, tt.want, got)
		})
	}
}
