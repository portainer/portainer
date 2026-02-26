package boltdb

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"

	"github.com/pkg/errors"
	"github.com/segmentio/encoding/json"
)

var errEncryptedStringTooShort = errors.New("encrypted string too short")

// MarshalObject encodes an object to binary format
func (connection *DbConnection) MarshalObject(object any) ([]byte, error) {
	buf := &bytes.Buffer{}

	// Special case for the VERSION bucket. Here we're not using json
	if v, ok := object.(string); ok {
		buf.WriteString(v)
	} else {
		enc := json.NewEncoder(buf)
		enc.SetSortMapKeys(false)
		enc.SetAppendNewline(false)

		if err := enc.Encode(object); err != nil {
			return nil, err
		}
	}

	if connection.getEncryptionKey() == nil {
		return buf.Bytes(), nil
	}

	return encrypt(buf.Bytes(), connection.getEncryptionKey())
}

// UnmarshalObject decodes an object from binary data
func (connection *DbConnection) UnmarshalObject(data []byte, object any) error {
	var err error
	if connection.getEncryptionKey() != nil {
		data, err = decrypt(data, connection.getEncryptionKey())
		if err != nil {
			return errors.Wrap(err, "Failed decrypting object")
		}
	}

	if err := json.Unmarshal(data, object); err != nil {
		// Special case for the VERSION bucket. Here we're not using json
		// So we need to return it as a string
		s, ok := object.(*string)
		if !ok {
			return errors.Wrap(err, "Failed unmarshalling object")
		}

		*s = string(data)
	}

	return err
}

// mmm, don't have a KMS .... aes GCM seems the most likely from
// https://gist.github.com/atoponce/07d8d4c833873be2f68c34f9afc5a78a#symmetric-encryption

func encrypt(plaintext []byte, passphrase []byte) (encrypted []byte, err error) {
	block, err := aes.NewCipher(passphrase)
	if err != nil {
		return encrypted, err
	}

	// NewGCMWithRandomNonce in go 1.24 handles setting up the nonce and adding it to the encrypted output
	gcm, err := cipher.NewGCMWithRandomNonce(block)
	if err != nil {
		return encrypted, err
	}

	return gcm.Seal(nil, nil, plaintext, nil), nil
}

func decrypt(encrypted []byte, passphrase []byte) (plaintextByte []byte, err error) {
	if string(encrypted) == "false" {
		return []byte("false"), nil
	}

	block, err := aes.NewCipher(passphrase)
	if err != nil {
		return encrypted, errors.Wrap(err, "Error creating cypher block")
	}

	// NewGCMWithRandomNonce in go 1.24 handles reading the nonce from the encrypted input for us
	gcm, err := cipher.NewGCMWithRandomNonce(block)
	if err != nil {
		return encrypted, errors.Wrap(err, "Error creating GCM")
	}

	if len(encrypted) < gcm.NonceSize() {
		return encrypted, errEncryptedStringTooShort
	}

	plaintextByte, err = gcm.Open(nil, nil, encrypted, nil)
	if err != nil {
		return encrypted, errors.Wrap(err, "Error decrypting text")
	}

	return plaintextByte, err
}
