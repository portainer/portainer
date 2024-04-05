package crypto

import (
	"io"
	"math/rand"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

var letterRunes = []byte("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func RandStringBytes(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return b
}

func Test_encryptAndDecrypt_withTheSamePassword(t *testing.T) {
	tmpdir := t.TempDir()

	var (
		originFilePath    = filepath.Join(tmpdir, "origin")
		encryptedFilePath = filepath.Join(tmpdir, "encrypted")
		decryptedFilePath = filepath.Join(tmpdir, "decrypted")
	)

	//content := []byte("content")
	content := RandStringBytes(1024)

	os.WriteFile(originFilePath, content, 0600)
	//generateFileContent(originFilePath, 7)

	//time.Sleep(2 * time.Second)

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

	content := []byte("content")
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

	content := []byte("content")
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
