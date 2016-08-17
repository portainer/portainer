package main

import (
	"encoding/json"
	"net/http"
)

// Settings defines the settings available under the /settings endpoint
type Settings struct {
	Swarm        bool     `json:"swarm"`
	HiddenLabels pairList `json:"hiddenLabels"`
	Logo         string   `json:"logo"`
}

// configurationHandler defines a handler function used to encode the configuration in JSON
func settingsHandler(w http.ResponseWriter, r *http.Request, s *Settings) {
	json.NewEncoder(w).Encode(*s)
}
