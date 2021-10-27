package boltdb

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"

	jsoniter "github.com/json-iterator/go"
	"github.com/sirupsen/logrus"
)

var encryptedStringTooShort = fmt.Errorf("encrypted string too short")

// MarshalObject encodes an object to binary format
func MarshalObject(object interface{}, passphrase string) ([]byte, error) {
	data, err := json.Marshal(object)
	if err != nil {
		logrus.WithError(err).Errorf("failed marshaling object")
		return data, err
	}
	if passphrase == "" {
		logrus.Infof("no encryption passphrase")
		return data, nil
	}
	return encrypt(data, passphrase)
}

// UnmarshalObject decodes an object from binary data
func UnmarshalObject(data []byte, object interface{}, passphrase string) error {
	if passphrase == "" {
		logrus.Infof("no encryption passphrase")
	} else {
		var err error
		data, err = decrypt(data, passphrase)
		if err != nil {
			logrus.WithError(err).Errorf("failed decrypting object")
			return err
		}
	}
	return json.Unmarshal(data, object)
}

// UnmarshalObjectWithJsoniter decodes an object from binary data
// using the jsoniter library. It is mainly used to accelerate environment(endpoint)
// decoding at the moment.
func UnmarshalObjectWithJsoniter(data []byte, object interface{}, passphrase string) error {
	if passphrase == "" {
		logrus.Infof("no encryption passphrase")
	} else {
		var err error
		data, err = decrypt(data, passphrase)
		if err != nil {
			logrus.WithError(err).Errorf("failed decrypting object")
			return err
		}
	}
	var jsoni = jsoniter.ConfigCompatibleWithStandardLibrary
	return jsoni.Unmarshal(data, &object)
}

// mmm, don't have a KMS .... aes GCM seems the most likely from
// https://gist.github.com/atoponce/07d8d4c833873be2f68c34f9afc5a78a#symmetric-encryption

func encrypt(plaintext []byte, passphrase string) (encrypted []byte, err error) {
	logrus.Infof("encrypt")
	block, _ := aes.NewCipher([]byte(passphrase))
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return encrypted, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return encrypted, err
	}
	ciphertextByte := gcm.Seal(
		nonce,
		nonce,
		plaintext,
		nil)
	return ciphertextByte, nil
}

// On error, return the original byte array - it might be unencrypted...
func decrypt(encrypted []byte, passphrase string) (plaintextByte []byte, err error) {
	passphraseByte := []byte(passphrase)
	block, err := aes.NewCipher(passphraseByte)
	if err != nil {
		logrus.Infof("NOT decrypted")

		return encrypted, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		logrus.Infof("NOT decrypted")

		return encrypted, err
	}
	nonceSize := gcm.NonceSize()
	if len(encrypted) < nonceSize {
		logrus.Infof("NOT decrypted")

		return encrypted, encryptedStringTooShort
	}
	nonce, ciphertextByteClean := encrypted[:nonceSize], encrypted[nonceSize:]
	plaintextByte, err = gcm.Open(
		nil,
		nonce,
		ciphertextByteClean,
		nil)
	if err != nil {
		logrus.Infof("NOT decrypted")

		return encrypted, err
	}
	logrus.Infof("decrypted")
	return plaintextByte, err
}
