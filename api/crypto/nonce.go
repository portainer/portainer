package crypto

import (
	"crypto/rand"
	"errors"
	"io"
)

type Nonce struct {
	val []byte
}

func NewNonce(size int) *Nonce {
	return &Nonce{val: make([]byte, size)}
}

// NewRandom generates a new initial nonce with random and sequential parts.
// https://www.oreilly.com/library/view/secure-programming-cookbook/0596003943/ch04s09.html
func NewRandomNonce(size int, randomBytes int) (*Nonce, error) {
	// Check if size is greater than randomBytes
	if size <= randomBytes {
		return nil, errors.New("nonce size must be greater than the number of random bytes")
	}

	// Generate random initial value for the random part
	randomPart := make([]byte, randomBytes)
	if _, err := rand.Read(randomPart); err != nil {
		return nil, err
	}

	// Fill the remaining bytes with zeros
	sequentialPart := make([]byte, size-randomBytes)

	// Combine randomPart and sequentialPart to create the initial nonce
	nonceVal := append(randomPart, sequentialPart...)

	return &Nonce{val: nonceVal}, nil
}

func (n *Nonce) Read(stream io.Reader) error {
	_, err := io.ReadFull(stream, n.val)
	return err
}

func (n *Nonce) Value() []byte {
	return n.val
}

func (n *Nonce) Increment() error {
	// Start incrementing from the least significant byte
	for i := len(n.val) - 1; i >= 0; i-- {
		// Increment the current byte
		n.val[i]++

		// Check for overflow
		if n.val[i] != 0 {
			// No overflow, nonce is successfully incremented
			return nil
		}
	}

	// If we reach here, it means the nonce has overflowed
	return errors.New("nonce overflow")
}
