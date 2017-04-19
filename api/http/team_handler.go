package http

import (
	"strconv"

	"github.com/portainer/portainer"

	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/asaskevich/govalidator"
	"github.com/gorilla/mux"
)

// TeamHandler represents an HTTP API handler for managing teams.
type TeamHandler struct {
	*mux.Router
	Logger                 *log.Logger
	TeamService            portainer.TeamService
	ResourceControlService portainer.ResourceControlService
}

// NewTeamHandler returns a new instance of TeamHandler.
func NewTeamHandler(mw *middleWareService) *TeamHandler {
	h := &TeamHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/teams",
		mw.administrator(http.HandlerFunc(h.handlePostTeams))).Methods(http.MethodPost)
	h.Handle("/teams",
		mw.administrator(http.HandlerFunc(h.handleGetTeams))).Methods(http.MethodGet)
	h.Handle("/teams/{id}",
		mw.administrator(http.HandlerFunc(h.handleGetTeam))).Methods(http.MethodGet)
	h.Handle("/teams/{id}",
		mw.authenticated(http.HandlerFunc(h.handlePutTeam))).Methods(http.MethodPut)
	h.Handle("/teams/{id}",
		mw.administrator(http.HandlerFunc(h.handleDeleteTeam))).Methods(http.MethodDelete)
	h.Handle("/teams/{teamId}/resources/{resourceType}",
		mw.authenticated(http.HandlerFunc(h.handlePostTeamResource))).Methods(http.MethodPost)
	h.Handle("/teams/{teamId}/resources/{resourceType}/{resourceId}",
		mw.authenticated(http.HandlerFunc(h.handleDeleteTeamResource))).Methods(http.MethodDelete)

	return h
}

// handlePostTeams handles POST requests on /teams
func (handler *TeamHandler) handlePostTeams(w http.ResponseWriter, r *http.Request) {
	var req postTeamsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	team, err := handler.TeamService.TeamByName(req.Name)
	if err != nil && err != portainer.ErrTeamNotFound {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	if team != nil {
		Error(w, portainer.ErrTeamAlreadyExists, http.StatusConflict, handler.Logger)
		return
	}

	team = &portainer.Team{
		Name: req.Name,
	}

	err = handler.TeamService.CreateTeam(team)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type postTeamsRequest struct {
	Name string `valid:"alphanum,required"`
}

// handleGetTeams handles GET requests on /teams
func (handler *TeamHandler) handleGetTeams(w http.ResponseWriter, r *http.Request) {
	teams, err := handler.TeamService.Teams()
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, teams, handler.Logger)
}

// handleGetTeam handles GET requests on /teams/:id
func (handler *TeamHandler) handleGetTeam(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	teamID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	team, err := handler.TeamService.Team(portainer.TeamID(teamID))
	if err == portainer.ErrTeamNotFound {
		Error(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &team, handler.Logger)
}

// handlePutTeam handles PUT requests on /teams/:id
func (handler *TeamHandler) handlePutTeam(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	teamID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putTeamRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	team, err := handler.TeamService.Team(portainer.TeamID(teamID))
	if err == portainer.ErrTeamNotFound {
		Error(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.TeamService.UpdateTeam(team.ID, team)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type putTeamRequest struct {
	Name string `valid:"alphanum,required"`
}

// handleDeleteTeam handles DELETE requests on /teams/:id
func (handler *TeamHandler) handleDeleteTeam(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	teamID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = handler.TeamService.Team(portainer.TeamID(teamID))

	if err == portainer.ErrTeamNotFound {
		Error(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.TeamService.DeleteTeam(portainer.TeamID(teamID))
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handlePostTeamResource handles POST requests on /teams/:teamId/resources/:resourceType
func (handler *TeamHandler) handlePostTeamResource(w http.ResponseWriter, r *http.Request) {
	return
}

type postTeamResourceRequest struct {
	ResourceID string `valid:"required"`
}

// handleDeleteTeamResource handles DELETE requests on /teams/:teamId/resources/:resourceType/:resourceId
func (handler *TeamHandler) handleDeleteTeamResource(w http.ResponseWriter, r *http.Request) {
	return
}
