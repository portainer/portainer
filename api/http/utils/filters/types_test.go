package filters

import (
	"errors"
	"fmt"
	"strconv"
)

// Test data structures
type User struct {
	ID    int
	Name  string
	Email string
	Age   int
}

type Product struct {
	ID          int
	Name        string
	Description string
	Price       int
	Category    string
}

// User accessors
func userIDAccessor(u User) (string, error) {
	return strconv.Itoa(u.ID), nil
}

func userNameAccessor(u User) (string, error) {
	return u.Name, nil
}

func userEmailAccessor(u User) (string, error) {
	return u.Email, nil
}

func userAgeAccessor(u User) (string, error) {
	return strconv.Itoa(u.Age), nil
}

// Product accessors

func productNameAccessor(p Product) (string, error) {
	return p.Name, nil
}

func productDescriptionAccessor(p Product) (string, error) {
	return p.Description, nil
}

func productPriceAccessor(p Product) (string, error) {
	return fmt.Sprintf("$%d", p.Price), nil
}

func productCategoryAccessor(p Product) (string, error) {
	return p.Category, nil
}

// Other accessors
func errorAccessor[T any](t T) (string, error) {
	return "", errors.New("accessor error")
}
