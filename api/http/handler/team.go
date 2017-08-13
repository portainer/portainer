package handler

import (
	"strconv"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/security"

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
	TeamMembershipService  portainer.TeamMembershipService
	ResourceControlService portainer.ResourceControlService
}

// NewTeamHandler returns a new instance of TeamHandler.
func NewTeamHandler(bouncer *security.RequestBouncer) *TeamHandler {
	h := &TeamHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/teams",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePostTeams))).Methods(http.MethodPost)
	h.Handle("/teams",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handleGetTeams))).Methods(http.MethodGet)
	h.Handle("/teams/{id}",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handleGetTeam))).Methods(http.MethodGet)
	h.Handle("/teams/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePutTeam))).Methods(http.MethodPut)
	h.Handle("/teams/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handleDeleteTeam))).Methods(http.MethodDelete)
	h.Handle("/teams/{id}/memberships",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handleGetMemberships))).Methods(http.MethodGet)

	return h
}

type (
	postTeamsRequest struct {
		Name string `valid:"required"`
	}

	postTeamsResponse struct {
		ID int `json:"Id"`
	}

	putTeamRequest struct {
		Name string `valid:"-"`
	}
)

// handlePostTeams handles POST requests on /teams
func (handler *TeamHandler) handlePostTeams(w http.ResponseWriter, r *http.Request) {
	var req postTeamsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	team, err := handler.TeamService.TeamByName(req.Name)
	if err != nil && err != portainer.ErrTeamNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	if team != nil {
		httperror.WriteErrorResponse(w, portainer.ErrTeamAlreadyExists, http.StatusConflict, handler.Logger)
		return
	}

	team = &portainer.Team{
		Name: req.Name,
	}

	err = handler.TeamService.CreateTeam(team)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postTeamsResponse{ID: int(team.ID)}, handler.Logger)
}

// handleGetTeams handles GET requests on /teams
func (handler *TeamHandler) handleGetTeams(w http.ResponseWriter, r *http.Request) {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	teams, err := handler.TeamService.Teams()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	filteredTeams := security.FilterUserTeams(teams, securityContext)

	encodeJSON(w, filteredTeams, handler.Logger)
}

// handleGetTeam handles GET requests on /teams/:id
func (handler *TeamHandler) handleGetTeam(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	tid, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}
	teamID := portainer.TeamID(tid)

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if !security.AuthorizedTeamManagement(teamID, securityContext) {
		httperror.WriteErrorResponse(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, handler.Logger)
		return
	}

	team, err := handler.TeamService.Team(teamID)
	if err == portainer.ErrTeamNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
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
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putTeamRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	team, err := handler.TeamService.Team(portainer.TeamID(teamID))
	if err == portainer.ErrTeamNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if req.Name != "" {
		team.Name = req.Name
	}

	err = handler.TeamService.UpdateTeam(team.ID, team)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handleDeleteTeam handles DELETE requests on /teams/:id
func (handler *TeamHandler) handleDeleteTeam(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	teamID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = handler.TeamService.Team(portainer.TeamID(teamID))

	if err == portainer.ErrTeamNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.TeamService.DeleteTeam(portainer.TeamID(teamID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.TeamMembershipService.DeleteTeamMembershipByTeamID(portainer.TeamID(teamID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handleGetMemberships handles GET requests on /teams/:id/memberships
func (handler *TeamHandler) handleGetMemberships(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	tid, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}
	teamID := portainer.TeamID(tid)

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if !security.AuthorizedTeamManagement(teamID, securityContext) {
		httperror.WriteErrorResponse(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, handler.Logger)
		return
	}

	memberships, err := handler.TeamMembershipService.TeamMembershipsByTeamID(teamID)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, memberships, handler.Logger)
}
