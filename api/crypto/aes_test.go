package crypto

import (
	"io"
	"math/rand"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func randBytes(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return b
}

func Test_encryptAndDecrypt_withTheSamePassword(t *testing.T) {
	const passphrase = "passphrase"

	tmpdir := t.TempDir()

	var (
		originFilePath    = filepath.Join(tmpdir, "origin")
		encryptedFilePath = filepath.Join(tmpdir, "encrypted")
		decryptedFilePath = filepath.Join(tmpdir, "decrypted")
	)

	content := randBytes(1024*1024*100 + 523)
	os.WriteFile(originFilePath, content, 0600)

	originFile, _ := os.Open(originFilePath)
	defer originFile.Close()

	encryptedFileWriter, _ := os.Create(encryptedFilePath)

	err := AesEncrypt(originFile, encryptedFileWriter, []byte(passphrase))
	assert.Nil(t, err, "Failed to encrypt a file")
	encryptedFileWriter.Close()

	encryptedContent, err := os.ReadFile(encryptedFilePath)
	assert.Nil(t, err, "Couldn't read encrypted file")
	assert.NotEqual(t, encryptedContent, content, "Content wasn't encrypted")

	encryptedFileReader, _ := os.Open(encryptedFilePath)
	defer encryptedFileReader.Close()

	decryptedFileWriter, _ := os.Create(decryptedFilePath)
	defer decryptedFileWriter.Close()

	decryptedReader, err := AesDecrypt(encryptedFileReader, []byte(passphrase))
	assert.Nil(t, err, "Failed to decrypt file")

	io.Copy(decryptedFileWriter, decryptedReader)

	decryptedContent, _ := os.ReadFile(decryptedFilePath)
	assert.Equal(t, content, decryptedContent, "Original and decrypted content should match")
}

func Test_encryptAndDecrypt_withStrongPassphrase(t *testing.T) {
	const passphrase = "A strong passphrase with special characters: !@#$%^&*()_+"
	tmpdir := t.TempDir()

	var (
		originFilePath    = filepath.Join(tmpdir, "origin2")
		encryptedFilePath = filepath.Join(tmpdir, "encrypted2")
		decryptedFilePath = filepath.Join(tmpdir, "decrypted2")
	)

	content := randBytes(500)
	os.WriteFile(originFilePath, content, 0600)

	originFile, _ := os.Open(originFilePath)
	defer originFile.Close()

	encryptedFileWriter, _ := os.Create(encryptedFilePath)

	err := AesEncrypt(originFile, encryptedFileWriter, []byte(passphrase))
	assert.Nil(t, err, "Failed to encrypt a file")
	encryptedFileWriter.Close()

	encryptedContent, err := os.ReadFile(encryptedFilePath)
	assert.Nil(t, err, "Couldn't read encrypted file")
	assert.NotEqual(t, encryptedContent, content, "Content wasn't encrypted")

	encryptedFileReader, _ := os.Open(encryptedFilePath)
	defer encryptedFileReader.Close()

	decryptedFileWriter, _ := os.Create(decryptedFilePath)
	defer decryptedFileWriter.Close()

	decryptedReader, err := AesDecrypt(encryptedFileReader, []byte(passphrase))
	assert.Nil(t, err, "Failed to decrypt file")

	io.Copy(decryptedFileWriter, decryptedReader)

	decryptedContent, _ := os.ReadFile(decryptedFilePath)
	assert.Equal(t, content, decryptedContent, "Original and decrypted content should match")
}

func Test_encryptAndDecrypt_withTheSamePasswordSmallFile(t *testing.T) {
	tmpdir := t.TempDir()

	var (
		originFilePath    = filepath.Join(tmpdir, "origin2")
		encryptedFilePath = filepath.Join(tmpdir, "encrypted2")
		decryptedFilePath = filepath.Join(tmpdir, "decrypted2")
	)

	content := randBytes(500)
	os.WriteFile(originFilePath, content, 0600)

	originFile, _ := os.Open(originFilePath)
	defer originFile.Close()

	encryptedFileWriter, _ := os.Create(encryptedFilePath)

	err := AesEncrypt(originFile, encryptedFileWriter, []byte("passphrase"))
	assert.Nil(t, err, "Failed to encrypt a file")
	encryptedFileWriter.Close()

	encryptedContent, err := os.ReadFile(encryptedFilePath)
	assert.Nil(t, err, "Couldn't read encrypted file")
	assert.NotEqual(t, encryptedContent, content, "Content wasn't encrypted")

	encryptedFileReader, _ := os.Open(encryptedFilePath)
	defer encryptedFileReader.Close()

	decryptedFileWriter, _ := os.Create(decryptedFilePath)
	defer decryptedFileWriter.Close()

	decryptedReader, err := AesDecrypt(encryptedFileReader, []byte("passphrase"))
	assert.Nil(t, err, "Failed to decrypt file")

	io.Copy(decryptedFileWriter, decryptedReader)

	decryptedContent, _ := os.ReadFile(decryptedFilePath)
	assert.Equal(t, content, decryptedContent, "Original and decrypted content should match")
}

func Test_encryptAndDecrypt_withEmptyPassword(t *testing.T) {
	tmpdir := t.TempDir()

	var (
		originFilePath    = filepath.Join(tmpdir, "origin")
		encryptedFilePath = filepath.Join(tmpdir, "encrypted")
		decryptedFilePath = filepath.Join(tmpdir, "decrypted")
	)

	content := randBytes(1024 * 50)
	os.WriteFile(originFilePath, content, 0600)

	originFile, _ := os.Open(originFilePath)
	defer originFile.Close()

	encryptedFileWriter, _ := os.Create(encryptedFilePath)
	defer encryptedFileWriter.Close()

	err := AesEncrypt(originFile, encryptedFileWriter, []byte(""))
	assert.Nil(t, err, "Failed to encrypt a file")
	encryptedContent, err := os.ReadFile(encryptedFilePath)
	assert.Nil(t, err, "Couldn't read encrypted file")
	assert.NotEqual(t, encryptedContent, content, "Content wasn't encrypted")

	encryptedFileReader, _ := os.Open(encryptedFilePath)
	defer encryptedFileReader.Close()

	decryptedFileWriter, _ := os.Create(decryptedFilePath)
	defer decryptedFileWriter.Close()

	decryptedReader, err := AesDecrypt(encryptedFileReader, []byte(""))
	assert.Nil(t, err, "Failed to decrypt file")

	io.Copy(decryptedFileWriter, decryptedReader)

	decryptedContent, _ := os.ReadFile(decryptedFilePath)
	assert.Equal(t, content, decryptedContent, "Original and decrypted content should match")
}

func Test_decryptWithDifferentPassphrase_shouldProduceWrongResult(t *testing.T) {
	tmpdir := t.TempDir()

	var (
		originFilePath    = filepath.Join(tmpdir, "origin")
		encryptedFilePath = filepath.Join(tmpdir, "encrypted")
		decryptedFilePath = filepath.Join(tmpdir, "decrypted")
	)

	content := randBytes(1034)
	os.WriteFile(originFilePath, content, 0600)

	originFile, _ := os.Open(originFilePath)
	defer originFile.Close()

	encryptedFileWriter, _ := os.Create(encryptedFilePath)
	defer encryptedFileWriter.Close()

	err := AesEncrypt(originFile, encryptedFileWriter, []byte("passphrase"))
	assert.Nil(t, err, "Failed to encrypt a file")
	encryptedContent, err := os.ReadFile(encryptedFilePath)
	assert.Nil(t, err, "Couldn't read encrypted file")
	assert.NotEqual(t, encryptedContent, content, "Content wasn't encrypted")

	encryptedFileReader, _ := os.Open(encryptedFilePath)
	defer encryptedFileReader.Close()

	decryptedFileWriter, _ := os.Create(decryptedFilePath)
	defer decryptedFileWriter.Close()

	_, err = AesDecrypt(encryptedFileReader, []byte("garbage"))
	assert.NotNil(t, err, "Should not allow decrypt with wrong passphrase")
}
