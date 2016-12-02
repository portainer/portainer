package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
)

type (
	credentials struct {
		Username string
		Password string
	}
	authResponse struct {
		JWT string `json:"jwt"`
	}
)

// authHandler defines a handler function used to authenticate users
func (api *api) authHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Unable to parse request body", http.StatusBadRequest)
		return
	}

	var credentials credentials
	err = json.Unmarshal(body, &credentials)
	if err != nil {
		http.Error(w, "Unable to parse credentials", http.StatusBadRequest)
		return
	}

	var username = credentials.Username
	var password = credentials.Password
	u, err := api.dataStore.retrieveUser(username)
	if err != nil {
		log.Printf("User not found: %s", username)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	if password != u.Password {
		log.Printf("Invalid credentials for user: %s", username)
		http.Error(w, "Invalid credentials", http.StatusUnprocessableEntity)
		return
	}

	token, err := api.generateJWTToken(username)
	if err != nil {
		log.Printf("Unable to generate JWT token: %s", err.Error())
		http.Error(w, "Unable to generate JWT token", http.StatusInternalServerError)
		return
	}

	response := authResponse{
		JWT: token,
	}
	json.NewEncoder(w).Encode(response)
}
