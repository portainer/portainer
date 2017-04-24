package handler

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/middleware"
)

// TemplatesHandler represents an HTTP API handler for managing templates.
type TemplatesHandler struct {
	*mux.Router
	Logger                *log.Logger
	containerTemplatesURL string
}

const (
	containerTemplatesURLLinuxServerIo = "http://tools.linuxserver.io/portainer.json"
)

// NewTemplatesHandler returns a new instance of TemplatesHandler.
func NewTemplatesHandler(mw *middleware.Service, containerTemplatesURL string) *TemplatesHandler {
	h := &TemplatesHandler{
		Router:                mux.NewRouter(),
		Logger:                log.New(os.Stderr, "", log.LstdFlags),
		containerTemplatesURL: containerTemplatesURL,
	}
	h.Handle("/templates",
		mw.Authenticated(http.HandlerFunc(h.handleGetTemplates)))
	return h
}

// handleGetTemplates handles GET requests on /templates?key=<key>
func (handler *TemplatesHandler) handleGetTemplates(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httperror.WriteMethodNotAllowedResponse(w, []string{http.MethodGet})
		return
	}

	key := r.FormValue("key")
	if key == "" {
		httperror.WriteErrorResponse(w, ErrInvalidQueryFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	var templatesURL string
	if key == "containers" {
		templatesURL = handler.containerTemplatesURL
	} else if key == "linuxserver.io" {
		templatesURL = containerTemplatesURLLinuxServerIo
	} else {
		httperror.WriteErrorResponse(w, ErrInvalidQueryFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	resp, err := http.Get(templatesURL)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
