package main

import (
	"encoding/json"
	"net/http"
)

// Config defines the configuration available under the /config endpoint
type Config struct {
	Swarm        bool     `json:"swarm"`
	HiddenLabels pairList `json:"hiddenLabels"`
	Registries   pairList `json:"registries"`
}

// newConfig creates a new Config from command flags
func newConfig(swarm bool, labels, registries pairList) Config {
	return Config{
		Swarm:        swarm,
		HiddenLabels: labels,
		Registries:   registries,
	}
}

// configurationHandler defines a handler function used to encode the configuration in JSON
func configurationHandler(w http.ResponseWriter, r *http.Request, c Config) {
	json.NewEncoder(w).Encode(c)
}
