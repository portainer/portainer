package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

// templatesHandler defines a handler function used to retrieve the templates from a URL and put them in the response
func templatesHandler(w http.ResponseWriter, r *http.Request, templatesURL string) {
	resp, err := http.Get(templatesURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error making request to %s: %s", templatesURL, err.Error()), http.StatusInternalServerError)
		log.Print(err)
		return
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Error reading body from templates URL", http.StatusInternalServerError)
		log.Print(err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
