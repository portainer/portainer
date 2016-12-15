package main

import (
	"github.com/dgrijalva/jwt-go"
	"time"
)

type claims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}

func (api *api) generateJWTToken(username string) (string, error) {
	expireToken := time.Now().Add(time.Hour * 8).Unix()
	claims := claims{
		username,
		jwt.StandardClaims{
			ExpiresAt: expireToken,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signedToken, err := token.SignedString(api.secret)
	if err != nil {
		return "", err
	}

	return signedToken, nil
}
