package http

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// TemplatesHandler represents an HTTP API handler for managing templates.
type TemplatesHandler struct {
	*mux.Router
	Logger            *log.Logger
	middleWareService *middleWareService
	templatesURL      string
}

// NewTemplatesHandler returns a new instance of TemplatesHandler.
func NewTemplatesHandler(middleWareService *middleWareService) *TemplatesHandler {
	h := &TemplatesHandler{
		Router:            mux.NewRouter(),
		Logger:            log.New(os.Stderr, "templateshandler", log.LstdFlags),
		middleWareService: middleWareService,
	}
	h.Handle("/templates", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handleGetTemplates(w, r)
	})))
	return h
}

// handleGetTemplates handles GET requests on /templates
func (handler *TemplatesHandler) handleGetTemplates(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		handleNotAllowed(w, []string{http.MethodGet})
		return
	}

	resp, err := http.Get(handler.templatesURL)
	if err != nil {
		log.Print(err)
		http.Error(w, fmt.Sprintf("Error making request to %s: %s", handler.templatesURL, err.Error()), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Print(err)
		http.Error(w, "Error reading body from templates URL", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
