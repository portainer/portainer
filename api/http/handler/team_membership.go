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

// TeamMembershipHandler represents an HTTP API handler for managing teams.
type TeamMembershipHandler struct {
	*mux.Router
	Logger                 *log.Logger
	TeamMembershipService  portainer.TeamMembershipService
	ResourceControlService portainer.ResourceControlService
}

// NewTeamMembershipHandler returns a new instance of TeamMembershipHandler.
func NewTeamMembershipHandler(bouncer *security.RequestBouncer) *TeamMembershipHandler {
	h := &TeamMembershipHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/team_memberships",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handlePostTeamMemberships))).Methods(http.MethodPost)
	h.Handle("/team_memberships",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handleGetTeamsMemberships))).Methods(http.MethodGet)
	h.Handle("/team_memberships/{id}",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handlePutTeamMembership))).Methods(http.MethodPut)
	h.Handle("/team_memberships/{id}",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handleDeleteTeamMembership))).Methods(http.MethodDelete)

	return h
}

// handlePostTeamMemberships handles POST requests on /team_memberships
func (handler *TeamMembershipHandler) handlePostTeamMemberships(w http.ResponseWriter, r *http.Request) {
	var req postTeamMembershipsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	userID := portainer.UserID(req.UserID)
	teamID := portainer.TeamID(req.TeamID)
	role := portainer.MembershipRole(req.Role)

	memberships, err := handler.TeamMembershipService.TeamMembershipsByUserID(userID)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	if len(memberships) > 0 {
		for _, membership := range memberships {
			if membership.UserID == userID && membership.TeamID == teamID {
				httperror.WriteErrorResponse(w, portainer.ErrTeamMembershipAlreadyExists, http.StatusConflict, handler.Logger)
				return
			}
		}
	}

	membership := &portainer.TeamMembership{
		UserID: userID,
		TeamID: teamID,
		Role:   role,
	}

	err = handler.TeamMembershipService.CreateTeamMembership(membership)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postTeamMembershipsResponse{ID: int(membership.ID)}, handler.Logger)
}

type postTeamMembershipsResponse struct {
	ID int `json:"Id"`
}

type postTeamMembershipsRequest struct {
	UserID int `valid:"required"`
	TeamID int `valid:"required"`
	Role   int `valid:"required"`
}

// handleGetTeamsMemberships handles GET requests on /team_memberships
func (handler *TeamMembershipHandler) handleGetTeamsMemberships(w http.ResponseWriter, r *http.Request) {
	memberships, err := handler.TeamMembershipService.TeamMemberships()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, memberships, handler.Logger)
}

// handlePutTeamMembership handles PUT requests on /team_memberships/:id
func (handler *TeamMembershipHandler) handlePutTeamMembership(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	membershipID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req putTeamMembershipRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	userID := portainer.UserID(req.UserID)
	teamID := portainer.TeamID(req.TeamID)
	role := portainer.MembershipRole(req.Role)

	membership, err := handler.TeamMembershipService.TeamMembership(portainer.TeamMembershipID(membershipID))
	if err == portainer.ErrTeamMembershipNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	membership.UserID = userID
	membership.TeamID = teamID
	membership.Role = role

	err = handler.TeamMembershipService.UpdateTeamMembership(membership.ID, membership)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type putTeamMembershipRequest struct {
	UserID int `valid:"required"`
	TeamID int `valid:"required"`
	Role   int `valid:"required"`
}

// handleDeleteTeamMembership handles DELETE requests on /team_memberships/:id
func (handler *TeamMembershipHandler) handleDeleteTeamMembership(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	membershipID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = handler.TeamMembershipService.TeamMembership(portainer.TeamMembershipID(membershipID))

	if err == portainer.ErrTeamMembershipNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.TeamMembershipService.DeleteTeamMembership(portainer.TeamMembershipID(membershipID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}
