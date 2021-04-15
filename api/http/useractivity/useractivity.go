package useractivity

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// LogHttpActivity logs an http request
func LogHttpActivity(store portainer.UserActivityStore, context string, request *http.Request, payload interface{}) {
	var body []byte

	if payload != nil {
		bodyMarshalled, err := json.Marshal(payload)
		if err != nil {
			log.Printf("[ERROR] [http,useractivity] [message: failed marshalling payload] [error: %s]", err)
			return
		}

		body = bodyMarshalled
	}

	logActivity(store, context, request, body)
}

// LogHttpActivity logs an http request to a proxy
// it parses the body as is (without cleaning)
func LogProxyActivity(store portainer.UserActivityStore, context string, request *http.Request, body []byte) {
	method := request.Method
	isWrite := method == "POST" || method == "DELETE" || method == "PUT" || method == "PATCH"
	if !isWrite {
		return
	}

	logActivity(store, context, request, body)
}

func logActivity(store portainer.UserActivityStore, context string, request *http.Request, body []byte) {
	if context == "" {
		context = "Portainer"
	}

	username := ""
	tokenData, err := security.RetrieveTokenData(request)
	if err == nil {
		username = tokenData.Username
	}

	// ignore binary content
	contentTypeHeader := request.Header.Get("Content-Type")
	if contentTypeHeader == "application/x-tar" {
		body = nil
	}

	store.LogUserActivity(username, context, fmt.Sprintf("%s %s", request.Method, request.RequestURI), body)

}
