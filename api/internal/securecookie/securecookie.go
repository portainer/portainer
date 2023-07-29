package securecookie

import (
	"crypto/rand"
	"io"
)

// GenerateRandomKey generates a random key of specified length
// source: https://github.com/gorilla/securecookie/blob/master/securecookie.go#L515
func GenerateRandomKey(length int) []byte {
	k := make([]byte, length)
	if _, err := io.ReadFull(rand.Reader, k); err != nil {
		return nil
	}
	return k
}
