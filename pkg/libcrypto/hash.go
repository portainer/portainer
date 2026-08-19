package libcrypto

import (
	"crypto/md5"
	"crypto/sha256"
	"encoding/hex"
)

// InsecureHashFromBytes returns the 16 byte md5 hash of the specified data
func InsecureHashFromBytes(data []byte) []byte {
	digest := md5.New()
	digest.Write(data)
	return digest.Sum(nil)
}

// InsecureHash32Bytes returns a hexadecimal encoded hash to make a 16 byte md5 hash into 32 bytes
func InsecureHash32Bytes(data []byte) []byte {
	hash := InsecureHashFromBytes(data)
	return []byte(hex.EncodeToString(hash))
}

// HashFromBytes returns the 32 byte sha256 hash of the specified data
func HashFromBytes(data []byte) []byte {
	hash := sha256.New()
	hash.Write(data)
	return hash.Sum(nil)
}
