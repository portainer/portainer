package main

import (
	"encoding/json"
	"github.com/portainer/portainer/common"
	"net/http"
)

// Settings defines the settings available under the /settings endpoint
type Settings struct {
	Swarm        bool          `json:"swarm"`
	HiddenLabels []common.Pair `json:"hiddenLabels"`
	Logo         string        `json:"logo"`
}

// settingsHandler defines a handler function used to encode the configuration in JSON
func settingsHandler(w http.ResponseWriter, r *http.Request, s *Settings) {
	json.NewEncoder(w).Encode(*s)
}
