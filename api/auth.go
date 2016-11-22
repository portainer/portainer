package main

import (
	"encoding/json"
	"net/http"
)

// User defines the object returned from the /auth endpoint
type User struct {
	Username string `json:"username"`
	Token    string `json:"token"`
}

// authHandler defines a handler function used to authenticate users
func authHandler(w http.ResponseWriter, r *http.Request) {
  user := &User{
    Username: "admin",
    Token: "TOKEN",
  }
	json.NewEncoder(w).Encode(*user)
}
