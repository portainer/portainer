package main

import (
	"github.com/gorilla/csrf"
	"github.com/gorilla/securecookie"
	"io/ioutil"
	"log"
	"net/http"
)

const keyFile = "authKey.dat"

// newAuthKey reuses an existing CSRF authkey if present or generates a new one
func newAuthKey(path string) []byte {
	var authKey []byte
	authKeyPath := path + "/" + keyFile
	data, err := ioutil.ReadFile(authKeyPath)
	if err != nil {
		log.Print("Unable to find an existing CSRF auth key. Generating a new key.")
		authKey = securecookie.GenerateRandomKey(32)
		err := ioutil.WriteFile(authKeyPath, authKey, 0644)
		if err != nil {
			log.Fatal("Unable to persist CSRF auth key.")
			log.Fatal(err)
		}
	} else {
		authKey = data
	}
	return authKey
}

// newCSRF initializes a new CSRF handler
func newCSRFHandler(keyPath string) func(h http.Handler) http.Handler {
	authKey := newAuthKey(keyPath)
	return csrf.Protect(
		authKey,
		csrf.HttpOnly(false),
		csrf.Secure(false),
	)
}

// newCSRFWrapper wraps a http.Handler to add the CSRF token
func newCSRFWrapper(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-CSRF-Token", csrf.Token(r))
		h.ServeHTTP(w, r)
	})
}
