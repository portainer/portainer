package boltdb

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"

	jsoniter "github.com/json-iterator/go"
	"github.com/pkg/errors"
)

var errEncryptedStringTooShort = fmt.Errorf("encrypted string too short")

// MarshalObject encodes an object to binary format
func (connection *DbConnection) MarshalObject(object interface{}) (data []byte, err error) {
	// Special case for the VERSION bucket. Here we're not using json
	if v, ok := object.(string); ok {
		data = []byte(v)
	} else {
		data, err = json.Marshal(object)
		if err != nil {
			return data, err
		}
	}
	if connection.getEncryptionKey() == nil {
		return data, nil
	}
	return encrypt(data, connection.getEncryptionKey())
}

// UnmarshalObject decodes an object from binary data
func (connection *DbConnection) UnmarshalObject(data []byte, object interface{}) error {
	var err error
	if connection.getEncryptionKey() != nil {
		data, err = decrypt(data, connection.getEncryptionKey())
		if err != nil {
			return errors.Wrap(err, "Failed decrypting object")
		}
	}
	e := json.Unmarshal(data, object)
	if e != nil {
		// Special case for the VERSION bucket. Here we're not using json
		// So we need to return it as a string
		s, ok := object.(*string)
		if !ok {
			return errors.Wrap(err, e.Error())
		}

		*s = string(data)
	}
	return err
}

// UnmarshalObjectWithJsoniter decodes an object from binary data
// using the jsoniter library. It is mainly used to accelerate environment(endpoint)
// decoding at the moment.
func (connection *DbConnection) UnmarshalObjectWithJsoniter(data []byte, object interface{}) error {
	if connection.getEncryptionKey() != nil {
		var err error
		data, err = decrypt(data, connection.getEncryptionKey())
		if err != nil {
			return err
		}
	}
	var jsoni = jsoniter.ConfigCompatibleWithStandardLibrary
	err := jsoni.Unmarshal(data, &object)
	if err != nil {
		if s, ok := object.(*string); ok {
			*s = string(data)
			return nil
		}

		return err
	}

	return nil
}

// mmm, don't have a KMS .... aes GCM seems the most likely from
// https://gist.github.com/atoponce/07d8d4c833873be2f68c34f9afc5a78a#symmetric-encryption

func encrypt(plaintext []byte, passphrase []byte) (encrypted []byte, err error) {
	block, _ := aes.NewCipher(passphrase)
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

func decrypt(encrypted []byte, passphrase []byte) (plaintextByte []byte, err error) {
	if string(encrypted) == "false" {
		return []byte("false"), nil
	}
	block, err := aes.NewCipher(passphrase)
	if err != nil {
		return encrypted, errors.Wrap(err, "Error creating cypher block")
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return encrypted, errors.Wrap(err, "Error creating GCM")
	}

	nonceSize := gcm.NonceSize()
	if len(encrypted) < nonceSize {
		return encrypted, errEncryptedStringTooShort
	}

	nonce, ciphertextByteClean := encrypted[:nonceSize], encrypted[nonceSize:]
	plaintextByte, err = gcm.Open(
		nil,
		nonce,
		ciphertextByteClean,
		nil)
	if err != nil {
		return encrypted, errors.Wrap(err, "Error decrypting text")
	}

	return plaintextByte, err
}
