package main

import (
	"encoding/json"
	"github.com/asaskevich/govalidator"
	"golang.org/x/crypto/bcrypt"
	"io/ioutil"
	"log"
	"net/http"
)

type (
	credentials struct {
		Username string `valid:"alphanum,required"`
		Password string `valid:"length(8)"`
	}
	authResponse struct {
		JWT string `json:"jwt"`
	}
)

func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", nil
	}
	return string(hash), nil
}

func checkPasswordValidity(password string, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// authHandler defines a handler function used to authenticate users
func (api *api) authHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.Header().Set("Allow", "POST")
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

	_, err = govalidator.ValidateStruct(credentials)
	if err != nil {
		http.Error(w, "Invalid credentials format", http.StatusBadRequest)
		return
	}

	var username = credentials.Username
	var password = credentials.Password
	u, err := api.dataStore.getUserByUsername(username)
	if err != nil {
		log.Printf("User not found: %s", username)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	err = checkPasswordValidity(password, u.Password)
	if err != nil {
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
