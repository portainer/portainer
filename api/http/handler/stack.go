package handler

import (
	"encoding/json"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"

	"log"
	"net/http"
	"os"

	"github.com/docker/libcompose/docker"
	"github.com/docker/libcompose/docker/ctx"
	"github.com/docker/libcompose/project"
	"github.com/docker/libcompose/project/options"
	"github.com/gorilla/mux"
	"golang.org/x/net/context"
)

// StackHandler represents an HTTP API handler for managing Stack.
type StackHandler struct {
	*mux.Router
	Logger      *log.Logger
	FileService portainer.FileService
}

// NewStackHandler returns a new instance of StackHandler.
func NewStackHandler(bouncer *security.RequestBouncer) *StackHandler {
	h := &StackHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/stack",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handlePostStack))).Methods(http.MethodPost)

	return h
}

// handlePostStack handles POST requests on /stack
func (handler *StackHandler) handlePostStack(w http.ResponseWriter, r *http.Request) {
	var req postStackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	composeFilePath, err := handler.FileService.StoreComposeFile(req.Name, req.ComposeFileContent)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	project, err := docker.NewProject(&ctx.Context{
		Context: project.Context{
			ComposeFiles: []string{composeFilePath},
			ProjectName:  req.Name,
		},
	}, nil)

	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = project.Up(context.Background(), options.Up{})
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type postStackRequest struct {
	Name               string `valid:"required"`
	ComposeFileContent string `valid:"required"`
}
