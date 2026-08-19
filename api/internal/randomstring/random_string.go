package randomstring

import "github.com/portainer/portainer/pkg/librand"

const letterBytes = "abcdefghijklmnopqrstuvwxyz0123456789"

// RandomString returns a random lowercase alphanumeric string of length n
func RandomString(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[librand.Intn(len(letterBytes))]
	}
	return string(b)
}
