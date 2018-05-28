package handler

import (
	"strconv"
	"strings"

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

// UserHandler represents an HTTP API handler for managing users.
type UserHandler struct {
	*mux.Router
	Logger                 *log.Logger
	UserService            portainer.UserService
	TeamService            portainer.TeamService
	TeamMembershipService  portainer.TeamMembershipService
	ResourceControlService portainer.ResourceControlService
	CryptoService          portainer.CryptoService
	SettingsService        portainer.SettingsService
}

// NewUserHandler returns a new instance of UserHandler.
func NewUserHandler(bouncer *security.RequestBouncer) *UserHandler {
	h := &UserHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/users",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handlePostUsers))).Methods(http.MethodPost)
	h.Handle("/users",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handleGetUsers))).Methods(http.MethodGet)
	h.Handle("/users/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handleGetUser))).Methods(http.MethodGet)
	h.Handle("/users/{id}",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handlePutUser))).Methods(http.MethodPut)
	h.Handle("/users/{id}",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handleDeleteUser))).Methods(http.MethodDelete)
	h.Handle("/users/{id}/memberships",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handleGetMemberships))).Methods(http.MethodGet)
	h.Handle("/users/{id}/passwd",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handlePostUserPasswd))).Methods(http.MethodPost)
	h.Handle("/users/admin/check",
		bouncer.PublicAccess(http.HandlerFunc(h.handleGetAdminCheck))).Methods(http.MethodGet)
	h.Handle("/users/admin/init",
		bouncer.PublicAccess(http.HandlerFunc(h.handlePostAdminInit))).Methods(http.MethodPost)

	return h
}

type (
	postUsersRequest struct {
		Username string `valid:"required"`
		Password string `valid:""`
		Role     int    `valid:"required"`
	}

	postUsersResponse struct {
		ID int `json:"Id"`
	}

	postUserPasswdRequest struct {
		Password string `valid:"required"`
	}

	postUserPasswdResponse struct {
		Valid bool `json:"valid"`
	}

	putUserRequest struct {
		Password string `valid:"-"`
		Role     int    `valid:"-"`
	}

	postAdminInitRequest struct {
		Username string `valid:"required"`
		Password string `valid:"required"`
	}
)

// handlePostUsers handles POST requests on /users
func (handler *UserHandler) handlePostUsers(w http.ResponseWriter, r *http.Request) {
	var req postUsersRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, httperror.ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, httperror.ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if !securityContext.IsAdmin && !securityContext.IsTeamLeader {
		httperror.WriteErrorResponse(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, nil)
		return
	}

	if securityContext.IsTeamLeader && req.Role == 1 {
		httperror.WriteErrorResponse(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, nil)
		return
	}

	if strings.ContainsAny(req.Username, " ") {
		httperror.WriteErrorResponse(w, portainer.ErrInvalidUsername, http.StatusBadRequest, handler.Logger)
		return
	}

	user, err := handler.UserService.UserByUsername(req.Username)
	if err != nil && err != portainer.ErrUserNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	if user != nil {
		httperror.WriteErrorResponse(w, portainer.ErrUserAlreadyExists, http.StatusConflict, handler.Logger)
		return
	}

	var role portainer.UserRole
	if req.Role == 1 {
		role = portainer.AdministratorRole
	} else {
		role = portainer.StandardUserRole
	}

	user = &portainer.User{
		Username: req.Username,
		Role:     role,
	}

	settings, err := handler.SettingsService.Settings()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if settings.AuthenticationMethod == portainer.AuthenticationInternal {
		user.Password, err = handler.CryptoService.Hash(req.Password)
		if err != nil {
			httperror.WriteErrorResponse(w, portainer.ErrCryptoHashFailure, http.StatusBadRequest, handler.Logger)
			return
		}
	}

	err = handler.UserService.CreateUser(user)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postUsersResponse{ID: int(user.ID)}, handler.Logger)
}

// handleGetUsers handles GET requests on /users
func (handler *UserHandler) handleGetUsers(w http.ResponseWriter, r *http.Request) {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	users, err := handler.UserService.Users()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	filteredUsers := security.FilterUsers(users, securityContext)

	for i := range filteredUsers {
		filteredUsers[i].Password = ""
	}

	encodeJSON(w, filteredUsers, handler.Logger)
}

// handlePostUserPasswd handles POST requests on /users/:id/passwd
func (handler *UserHandler) handlePostUserPasswd(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	userID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req postUserPasswdRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, httperror.ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, httperror.ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	var password = req.Password

	u, err := handler.UserService.User(portainer.UserID(userID))
	if err == portainer.ErrUserNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	valid := true
	err = handler.CryptoService.CompareHashAndData(u.Password, password)
	if err != nil {
		valid = false
	}

	encodeJSON(w, &postUserPasswdResponse{Valid: valid}, handler.Logger)
}

// handleGetUser handles GET requests on /users/:id
func (handler *UserHandler) handleGetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	userID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	user, err := handler.UserService.User(portainer.UserID(userID))
	if err == portainer.ErrUserNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	user.Password = ""
	encodeJSON(w, &user, handler.Logger)
}

// handlePutUser handles PUT requests on /users/:id
func (handler *UserHandler) handlePutUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	userID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if tokenData.Role != portainer.AdministratorRole && tokenData.ID != portainer.UserID(userID) {
		httperror.WriteErrorResponse(w, portainer.ErrUnauthorized, http.StatusForbidden, handler.Logger)
		return
	}

	var req putUserRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, httperror.ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, httperror.ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	if req.Password == "" && req.Role == 0 {
		httperror.WriteErrorResponse(w, httperror.ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	user, err := handler.UserService.User(portainer.UserID(userID))
	if err == portainer.ErrUserNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if req.Password != "" {
		user.Password, err = handler.CryptoService.Hash(req.Password)
		if err != nil {
			httperror.WriteErrorResponse(w, portainer.ErrCryptoHashFailure, http.StatusBadRequest, handler.Logger)
			return
		}
	}

	if req.Role != 0 {
		if tokenData.Role != portainer.AdministratorRole {
			httperror.WriteErrorResponse(w, portainer.ErrUnauthorized, http.StatusForbidden, handler.Logger)
			return
		}
		if req.Role == 1 {
			user.Role = portainer.AdministratorRole
		} else {
			user.Role = portainer.StandardUserRole
		}
	}

	err = handler.UserService.UpdateUser(user.ID, user)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handleGetAdminCheck handles GET requests on /users/admin/check
func (handler *UserHandler) handleGetAdminCheck(w http.ResponseWriter, r *http.Request) {
	users, err := handler.UserService.UsersByRole(portainer.AdministratorRole)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	if len(users) == 0 {
		httperror.WriteErrorResponse(w, portainer.ErrUserNotFound, http.StatusNotFound, handler.Logger)
		return
	}
}

// handlePostAdminInit handles POST requests on /users/admin/init
func (handler *UserHandler) handlePostAdminInit(w http.ResponseWriter, r *http.Request) {
	var req postAdminInitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, httperror.ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, httperror.ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	users, err := handler.UserService.UsersByRole(portainer.AdministratorRole)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	if len(users) == 0 {
		user := &portainer.User{
			Username: req.Username,
			Role:     portainer.AdministratorRole,
		}
		user.Password, err = handler.CryptoService.Hash(req.Password)
		if err != nil {
			httperror.WriteErrorResponse(w, portainer.ErrCryptoHashFailure, http.StatusBadRequest, handler.Logger)
			return
		}

		err = handler.UserService.CreateUser(user)
		if err != nil {
			httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	} else {
		httperror.WriteErrorResponse(w, portainer.ErrAdminAlreadyInitialized, http.StatusConflict, handler.Logger)
		return
	}
}

// handleDeleteUser handles DELETE requests on /users/:id
func (handler *UserHandler) handleDeleteUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	userID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	if userID == 1 {
		httperror.WriteErrorResponse(w, portainer.ErrCannotRemoveAdmin, http.StatusForbidden, handler.Logger)
		return
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if tokenData.ID == portainer.UserID(userID) {
		httperror.WriteErrorResponse(w, portainer.ErrAdminCannotRemoveSelf, http.StatusForbidden, handler.Logger)
		return
	}

	_, err = handler.UserService.User(portainer.UserID(userID))

	if err == portainer.ErrUserNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.UserService.DeleteUser(portainer.UserID(userID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.TeamMembershipService.DeleteTeamMembershipByUserID(portainer.UserID(userID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handleGetMemberships handles GET requests on /users/:id/memberships
func (handler *UserHandler) handleGetMemberships(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	userID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if tokenData.Role != portainer.AdministratorRole && tokenData.ID != portainer.UserID(userID) {
		httperror.WriteErrorResponse(w, portainer.ErrUnauthorized, http.StatusForbidden, handler.Logger)
		return
	}

	memberships, err := handler.TeamMembershipService.TeamMembershipsByUserID(portainer.UserID(userID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, memberships, handler.Logger)
}
