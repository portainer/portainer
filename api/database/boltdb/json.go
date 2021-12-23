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
func MarshalObject(object interface{}, encryptionKey []byte) (data []byte, err error) {

	// Special case for the VERSION bucket. Here we're not using json
	if v, ok := object.(string); ok {
		data = []byte(v)
	} else {
		data, err = json.Marshal(object)
		if err != nil {
			logrus.WithError(err).Errorf("failed marshaling object")
			return data, err
		}
	}

	if encryptionKey == nil {
		return data, nil
	}

	return encrypt(data, encryptionKey)
}

// UnmarshalObject decodes an object from binary data
func UnmarshalObject(data []byte, object interface{}, encryptionKey []byte) error {

	if encryptionKey != nil {
		var err error
		data, err = decrypt(data, encryptionKey)
		if err != nil {
			logrus.WithError(err).Errorf("failed decrypting object")
			return err
		}
	}

	err := json.Unmarshal(data, object)
	if err != nil {
		// Special case for the VERSION bucket. Here we're not using json
		// So we need to return it as a string
		s, ok := object.(*string)
		if !ok {
			return err
		}

		*s = string(data)
	}

	return nil
}

// UnmarshalObjectWithJsoniter decodes an object from binary data
// using the jsoniter library. It is mainly used to accelerate environment(endpoint)
// decoding at the moment.
func UnmarshalObjectWithJsoniter(data []byte, object interface{}, encryptionKey []byte) error {

	if encryptionKey != nil {
		var err error
		data, err = decrypt(data, encryptionKey)
		if err != nil {
			logrus.WithError(err).Errorf("failed decrypting object")
			return err
		}
	}

	var jsoni = jsoniter.ConfigCompatibleWithStandardLibrary
	return jsoni.Unmarshal(data, &object)
}

// We don't have a KMS... aes GCM seems the most likely from
// https://gist.github.com/atoponce/07d8d4c833873be2f68c34f9afc5a78a#symmetric-encryption
func encrypt(plaintext []byte, encryptionKey []byte) (encrypted []byte, err error) {
	block, _ := aes.NewCipher([]byte(encryptionKey))
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return encrypted, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return encrypted, err
	}

	return gcm.Seal(nonce, nonce, plaintext, nil), nil
}

// On error, return the original byte array - it might be unencrypted...
func decrypt(encrypted []byte, encryptionKey []byte) (plaintextByte []byte, err error) {
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return encrypted, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return encrypted, err
	}

	nonceSize := gcm.NonceSize()
	if len(encrypted) < nonceSize {
		return encrypted, encryptedStringTooShort
	}

	nonce, ciphertextByteClean := encrypted[:nonceSize], encrypted[nonceSize:]
	plaintextByte, err = gcm.Open(nil, nonce, ciphertextByteClean, nil)
	if err != nil {
		return encrypted, err
	}

	return plaintextByte, err
}
