package crypto

import "crypto/md5"

// HashFromBytes returns the hash of the specified data
func HashFromBytes(data []byte) []byte {
	digest := md5.New()
	digest.Write(data)
	return digest.Sum(nil)
}
