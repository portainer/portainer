package http

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// TemplatesHandler represents an HTTP API handler for managing templates.
type TemplatesHandler struct {
	*mux.Router
	Logger       *log.Logger
	templatesURL string
}

// NewTemplatesHandler returns a new instance of TemplatesHandler.
func NewTemplatesHandler(mw *middleWareService) *TemplatesHandler {
	h := &TemplatesHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/templates",
		mw.authenticated(http.HandlerFunc(h.handleGetTemplates)))
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
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
