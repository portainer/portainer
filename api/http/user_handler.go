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

// UserHandler represents an HTTP API handler for managing users.
type UserHandler struct {
	*mux.Router
	Logger                 *log.Logger
	UserService            portainer.UserService
	ResourceControlService portainer.ResourceControlService
	CryptoService          portainer.CryptoService
}

// NewUserHandler returns a new instance of UserHandler.
func NewUserHandler(mw *middleWareService) *UserHandler {
	h := &UserHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/users",
		mw.administrator(http.HandlerFunc(h.handlePostUsers))).Methods(http.MethodPost)
	h.Handle("/users",
		mw.administrator(http.HandlerFunc(h.handleGetUsers))).Methods(http.MethodGet)
	h.Handle("/users/{id}",
		mw.administrator(http.HandlerFunc(h.handleGetUser))).Methods(http.MethodGet)
	h.Handle("/users/{id}",
		mw.authenticated(http.HandlerFunc(h.handlePutUser))).Methods(http.MethodPut)
	h.Handle("/users/{id}",
		mw.administrator(http.HandlerFunc(h.handleDeleteUser))).Methods(http.MethodDelete)
	h.Handle("/users/{id}/passwd",
		mw.authenticated(http.HandlerFunc(h.handlePostUserPasswd)))
	h.Handle("/users/{userId}/resources/{resourceType}",
		mw.authenticated(http.HandlerFunc(h.handlePostUserResource))).Methods(http.MethodPost)
	h.Handle("/users/{userId}/resources/{resourceType}/{resourceId}",
		mw.authenticated(http.HandlerFunc(h.handleDeleteUserResource))).Methods(http.MethodDelete)
	h.Handle("/users/admin/check",
		mw.public(http.HandlerFunc(h.handleGetAdminCheck)))
	h.Handle("/users/admin/init",
		mw.public(http.HandlerFunc(h.handlePostAdminInit)))

	return h
}

// handlePostUsers handles POST requests on /users
func (handler *UserHandler) handlePostUsers(w http.ResponseWriter, r *http.Request) {
	var req postUsersRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	var role portainer.UserRole
	if req.Role == 1 {
		role = portainer.AdministratorRole
	} else {
		role = portainer.StandardUserRole
	}

	user, err := handler.UserService.UserByUsername(req.Username)
	if err != nil && err != portainer.ErrUserNotFound {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	if user != nil {
		Error(w, portainer.ErrUserAlreadyExists, http.StatusConflict, handler.Logger)
		return
	}

	user = &portainer.User{
		Username: req.Username,
		Role:     role,
	}
	user.Password, err = handler.CryptoService.Hash(req.Password)
	if err != nil {
		Error(w, portainer.ErrCryptoHashFailure, http.StatusBadRequest, handler.Logger)
		return
	}

	err = handler.UserService.CreateUser(user)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type postUsersRequest struct {
	Username string `valid:"alphanum,required"`
	Password string `valid:"required"`
	Role     int    `valid:"required"`
}

// handleGetUsers handles GET requests on /users
func (handler *UserHandler) handleGetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := handler.UserService.Users()
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	for i := range users {
		users[i].Password = ""
	}
	encodeJSON(w, users, handler.Logger)
}

// handlePostUserPasswd handles POST requests on /users/:id/passwd
func (handler *UserHandler) handlePostUserPasswd(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleNotAllowed(w, []string{http.MethodPost})
		return
	}

	vars := mux.Vars(r)
	id := vars["id"]

	userID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var req postUserPasswdRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	var password = req.Password

	u, err := handler.UserService.User(portainer.UserID(userID))
	if err == portainer.ErrUserNotFound {
		Error(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	valid := true
	err = handler.CryptoService.CompareHashAndData(u.Password, password)
	if err != nil {
		valid = false
	}

	encodeJSON(w, &postUserPasswdResponse{Valid: valid}, handler.Logger)
}

type postUserPasswdRequest struct {
	Password string `valid:"required"`
}

type postUserPasswdResponse struct {
	Valid bool `json:"valid"`
}

// handleGetUser handles GET requests on /users/:id
func (handler *UserHandler) handleGetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	userID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	user, err := handler.UserService.User(portainer.UserID(userID))
	if err == portainer.ErrUserNotFound {
		Error(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
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
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	tokenData, err := extractTokenDataFromRequestContext(r)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
	}

	if tokenData.Role != portainer.AdministratorRole && tokenData.ID != portainer.UserID(userID) {
		Error(w, portainer.ErrUnauthorized, http.StatusForbidden, handler.Logger)
		return
	}

	var req putUserRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	if req.Password == "" && req.Role == 0 {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	user, err := handler.UserService.User(portainer.UserID(userID))
	if err == portainer.ErrUserNotFound {
		Error(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	if req.Password != "" {
		user.Password, err = handler.CryptoService.Hash(req.Password)
		if err != nil {
			Error(w, portainer.ErrCryptoHashFailure, http.StatusBadRequest, handler.Logger)
			return
		}
	}

	if req.Role != 0 {
		if tokenData.Role != portainer.AdministratorRole {
			Error(w, portainer.ErrUnauthorized, http.StatusForbidden, handler.Logger)
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
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type putUserRequest struct {
	Password string `valid:"-"`
	Role     int    `valid:"-"`
}

// handlePostAdminInit handles GET requests on /users/admin/check
func (handler *UserHandler) handleGetAdminCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		handleNotAllowed(w, []string{http.MethodGet})
		return
	}

	users, err := handler.UserService.UsersByRole(portainer.AdministratorRole)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	if len(users) == 0 {
		Error(w, portainer.ErrUserNotFound, http.StatusNotFound, handler.Logger)
		return
	}
	encodeJSON(w, users, handler.Logger)
}

// handlePostAdminInit handles POST requests on /users/admin/init
func (handler *UserHandler) handlePostAdminInit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleNotAllowed(w, []string{http.MethodPost})
		return
	}

	var req postAdminInitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	user, err := handler.UserService.UserByUsername("admin")
	if err == portainer.ErrUserNotFound {
		user := &portainer.User{
			Username: "admin",
			Role:     portainer.AdministratorRole,
		}
		user.Password, err = handler.CryptoService.Hash(req.Password)
		if err != nil {
			Error(w, portainer.ErrCryptoHashFailure, http.StatusBadRequest, handler.Logger)
			return
		}

		err = handler.UserService.CreateUser(user)
		if err != nil {
			Error(w, err, http.StatusInternalServerError, handler.Logger)
			return
		}
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	if user != nil {
		Error(w, portainer.ErrAdminAlreadyInitialized, http.StatusForbidden, handler.Logger)
		return
	}
}

type postAdminInitRequest struct {
	Password string `valid:"required"`
}

// handleDeleteUser handles DELETE requests on /users/:id
func (handler *UserHandler) handleDeleteUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	userID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = handler.UserService.User(portainer.UserID(userID))

	if err == portainer.ErrUserNotFound {
		Error(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.UserService.DeleteUser(portainer.UserID(userID))
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handlePostUserResource handles POST requests on /users/:userId/resources/:resourceType
func (handler *UserHandler) handlePostUserResource(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userId"]
	resourceType := vars["resourceType"]

	uid, err := strconv.Atoi(userID)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var rcType portainer.ResourceControlType
	if resourceType == "container" {
		rcType = portainer.ContainerResourceControl
	} else if resourceType == "service" {
		rcType = portainer.ServiceResourceControl
	} else if resourceType == "volume" {
		rcType = portainer.VolumeResourceControl
	} else {
		Error(w, ErrInvalidQueryFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	tokenData, err := extractTokenDataFromRequestContext(r)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
	}
	if tokenData.ID != portainer.UserID(uid) {
		Error(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, handler.Logger)
		return
	}

	var req postUserResourceRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	resource := portainer.ResourceControl{
		OwnerID:     portainer.UserID(uid),
		ResourceID:  req.ResourceID,
		AccessLevel: portainer.RestrictedResourceAccessLevel,
	}

	err = handler.ResourceControlService.CreateResourceControl(req.ResourceID, &resource, rcType)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}
}

type postUserResourceRequest struct {
	ResourceID string `valid:"required"`
}

// handleDeleteUserResource handles DELETE requests on /users/:userId/resources/:resourceType/:resourceId
func (handler *UserHandler) handleDeleteUserResource(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userId"]
	resourceID := vars["resourceId"]
	resourceType := vars["resourceType"]

	uid, err := strconv.Atoi(userID)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	var rcType portainer.ResourceControlType
	if resourceType == "container" {
		rcType = portainer.ContainerResourceControl
	} else if resourceType == "service" {
		rcType = portainer.ServiceResourceControl
	} else if resourceType == "volume" {
		rcType = portainer.VolumeResourceControl
	} else {
		Error(w, ErrInvalidQueryFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	tokenData, err := extractTokenDataFromRequestContext(r)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
	}
	if tokenData.Role != portainer.AdministratorRole && tokenData.ID != portainer.UserID(uid) {
		Error(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, handler.Logger)
		return
	}

	err = handler.ResourceControlService.DeleteResourceControl(resourceID, rcType)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}
