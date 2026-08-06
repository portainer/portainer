package librand

import (
	"crypto/rand"
	"fmt"
	"math/big"
	mrand "math/rand/v2"

	"github.com/portainer/portainer/pkg/fips"
)

func Intn(max int) int {
	return intn(max, fips.FIPSMode())
}

func intn(max int, fips bool) int {
	return int(int64n(int64(max), fips))
}

func int64n(max int64, fips bool) int64 {
	if !fips {
		return mrand.Int64N(max)
	}

	i, err := rand.Int(rand.Reader, big.NewInt(max))
	if err != nil {
		panic(fmt.Sprintf("failed to generate a random number: %v", err))
	}
	if !i.IsInt64() {
		panic("generated random number cannot be represented as an int64")
	}

	return i.Int64()
}

const alphanumericChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

// String returns a random alphanumeric string of length n.
func String(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = alphanumericChars[int64n(int64(len(alphanumericChars)), true)]
	}

	return string(b)
}

func Float64() float64 {
	return randomFloat64(fips.FIPSMode())
}

func randomFloat64(fips bool) float64 {
	if !fips {
		return mrand.Float64()
	}

	// This is based of this comment https://cs.opensource.google/go/go/+/refs/tags/go1.24.5:src/math/rand/v2/rand.go;l=209
	return float64(int64n(1<<53, fips) / (1 << 53))
}
