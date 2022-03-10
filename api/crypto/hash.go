package crypto

import (
	"golang.org/x/crypto/bcrypt"
)

// Service represents a service for encrypting/hashing data.
type Service struct{}

// Hash hashes a string using the bcrypt algorithm
func (*Service) Hash(data string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(data), bcrypt.DefaultCost)
	return string(bytes), err
}

// CompareHashAndData compares a hash to clear data and returns an error if the comparison fails.
func (*Service) CompareHashAndData(hash string, data string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(data))
}
