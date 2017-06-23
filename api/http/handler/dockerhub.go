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

	"github.com/gorilla/mux"
)

// DockerHubHandler represents an HTTP API handler for managing DockerHub.
type DockerHubHandler struct {
	*mux.Router
	Logger           *log.Logger
	DockerHubService portainer.DockerHubService
}

// NewDockerHubHandler returns a new instance of DockerHubHandler.
func NewDockerHubHandler(bouncer *security.RequestBouncer) *DockerHubHandler {
	h := &DockerHubHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/dockerhub",
		bouncer.PublicAccess(http.HandlerFunc(h.handleGetDockerHub))).Methods(http.MethodGet)
	h.Handle("/dockerhub",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePutDockerHub))).Methods(http.MethodPut)

	return h
}

// handleGetDockerHub handles GET requests on /dockerhub
func (handler *DockerHubHandler) handleGetDockerHub(w http.ResponseWriter, r *http.Request) {
	dockerhub, err := handler.DockerHubService.DockerHub()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, dockerhub, handler.Logger)
	return
}

// handlePutDockerHub handles PUT requests on /dockerhub
func (handler *DockerHubHandler) handlePutDockerHub(w http.ResponseWriter, r *http.Request) {
	var req putDockerHubRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	dockerhub := &portainer.DockerHub{
		Authentication: false,
		Username:       "",
		Password:       "",
	}

	if req.Authentication {
		dockerhub.Authentication = true
		dockerhub.Username = req.Username
		dockerhub.Password = req.Password
	}

	err = handler.DockerHubService.StoreDockerHub(dockerhub)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
	}
}

type putDockerHubRequest struct {
	Authentication bool   `valid:""`
	Username       string `valid:""`
	Password       string `valid:""`
}
