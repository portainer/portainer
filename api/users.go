package main

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"io/ioutil"
	"log"
	"net/http"
)

type (
	passwordCheckRequest struct {
		Password string `json:"password"`
	}
	passwordCheckResponse struct {
		Valid bool `json:"valid"`
	}
)

func (api *api) usersHandler(w http.ResponseWriter, r *http.Request) {
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

	var user userItem
	err = json.Unmarshal(body, &user)
	if err != nil {
		http.Error(w, "Unable to parse user data", http.StatusBadRequest)
		return
	}

	err = api.dataStore.updateUser(user)
	if err != nil {
		log.Printf("Unable to persist user: %s", err.Error())
		http.Error(w, "Unable to persist user", http.StatusInternalServerError)
		return
	}
}

func (api *api) userHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "PUT" {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Unable to parse request body", http.StatusBadRequest)
			return
		}

		var user userItem
		err = json.Unmarshal(body, &user)
		if err != nil {
			http.Error(w, "Unable to parse user data", http.StatusBadRequest)
			return
		}

		err = api.dataStore.updateUser(user)
		if err != nil {
			log.Printf("Unable to persist user: %s", err.Error())
			http.Error(w, "Unable to persist user", http.StatusInternalServerError)
			return
		}
	} else if r.Method == "GET" {
		vars := mux.Vars(r)
		username := vars["username"]

		user, err := api.dataStore.getUserByUsername(username)
		if err == errUserNotFound {
			log.Printf("User not found: %s", username)
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		if err != nil {
			log.Printf("Unable to retrieve user: %s", err.Error())
			http.Error(w, "Unable to retrieve user", http.StatusInternalServerError)
			return
		}

		user.Password = ""
		json.NewEncoder(w).Encode(user)
	} else {
		w.Header().Set("Allow", "PUT")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
}

func (api *api) userPasswordHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.Header().Set("Allow", "POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	vars := mux.Vars(r)
	username := vars["username"]

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Unable to parse request body", http.StatusBadRequest)
		return
	}

	var data passwordCheckRequest
	err = json.Unmarshal(body, &data)
	if err != nil {
		http.Error(w, "Unable to parse user data", http.StatusBadRequest)
		return
	}

	user, err := api.dataStore.getUserByUsername(username)
	if err != nil {
		log.Printf("Unable to retrieve user: %s", err.Error())
		http.Error(w, "Unable to retrieve user", http.StatusInternalServerError)
		return
	}

	response := passwordCheckResponse{
		Valid: false,
	}
	if data.Password == user.Password {
		response.Valid = true
	}
	json.NewEncoder(w).Encode(response)
}
