package libcrypto

import (
	"crypto/md5"
	"encoding/hex"
)

// HashFromBytes returns the hash of the specified data
func HashFromBytes(data []byte) []byte {
	digest := md5.New()
	digest.Write(data)
	return digest.Sum(nil)
}

// Hash32Bit returns a hexadecimal encoded hash
func Hash32Bit(data []byte) []byte {
	hash := HashFromBytes(data)
	return []byte(hex.EncodeToString(hash))
}
