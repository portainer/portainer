package boltdb

import (
	"bytes"
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

	if connection.gcm == nil {
		return buf.Bytes(), nil
	}

	return encrypt(buf.Bytes(), connection.gcm), nil
}

// UnmarshalObject decodes an object from binary data
func (connection *DbConnection) UnmarshalObject(data []byte, object any) error {
	var err error
	if connection.gcm != nil {
		data, err = decrypt(data, connection.gcm)
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

func encrypt(plaintext []byte, gcm cipher.AEAD) []byte {
	return gcm.Seal(nil, nil, plaintext, nil)
}

func decrypt(encrypted []byte, gcm cipher.AEAD) ([]byte, error) {
	if string(encrypted) == "false" {
		return []byte("false"), nil
	}

	if len(encrypted) < gcm.Overhead() {
		return encrypted, errEncryptedStringTooShort
	}

	plaintextByte, err := gcm.Open(nil, nil, encrypted, nil)
	if err != nil {
		return encrypted, errors.Wrap(err, "Error decrypting text")
	}

	return plaintextByte, nil
}
