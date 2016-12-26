package http

import (
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
	Logger            *log.Logger
	UserService       portainer.UserService
	CryptoService     portainer.CryptoService
	middleWareService *middleWareService
}

// NewUserHandler returns a new instance of UserHandler.
func NewUserHandler(middleWareService *middleWareService) *UserHandler {
	h := &UserHandler{
		Router:            mux.NewRouter(),
		Logger:            log.New(os.Stderr, "", log.LstdFlags),
		middleWareService: middleWareService,
	}
	h.Handle("/users", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handlePostUsers(w, r)
	})))
	h.Handle("/users/{username}", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handleGetUser(w, r)
	}))).Methods(http.MethodGet)
	h.Handle("/users/{username}", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handlePutUser(w, r)
	}))).Methods(http.MethodPut)
	h.Handle("/users/{username}/passwd", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handlePostUserPasswd(w, r)
	})))
	h.HandleFunc("/users/admin/check", h.handleGetAdminCheck)
	h.HandleFunc("/users/admin/init", h.handlePostAdminInit)
	return h
}

// handlePostUsers handles POST requests on /users
func (handler *UserHandler) handlePostUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleNotAllowed(w, []string{http.MethodPost})
		return
	}

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

	user := &portainer.User{
		Username: req.Username,
	}
	user.Password, err = handler.CryptoService.Hash(req.Password)
	if err != nil {
		Error(w, portainer.ErrCryptoHashFailure, http.StatusBadRequest, handler.Logger)
		return
	}

	err = handler.UserService.UpdateUser(user)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type postUsersRequest struct {
	Username string `valid:"alphanum,required"`
	Password string `valid:"required"`
}

// handlePostUserPasswd handles POST requests on /users/:username/passwd
func (handler *UserHandler) handlePostUserPasswd(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleNotAllowed(w, []string{http.MethodPost})
		return
	}

	vars := mux.Vars(r)
	username := vars["username"]

	var req postUserPasswdRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	var password = req.Password

	u, err := handler.UserService.User(username)
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

// handleGetUser handles GET requests on /users/:username
func (handler *UserHandler) handleGetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	user, err := handler.UserService.User(username)
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

// handlePutUser handles PUT requests on /users/:username
func (handler *UserHandler) handlePutUser(w http.ResponseWriter, r *http.Request) {
	var req putUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	user := &portainer.User{
		Username: req.Username,
	}
	user.Password, err = handler.CryptoService.Hash(req.Password)
	if err != nil {
		Error(w, portainer.ErrCryptoHashFailure, http.StatusBadRequest, handler.Logger)
		return
	}

	err = handler.UserService.UpdateUser(user)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type putUserRequest struct {
	Username string `valid:"alphanum,required"`
	Password string `valid:"required"`
}

// handlePostAdminInit handles GET requests on /users/admin/check
func (handler *UserHandler) handleGetAdminCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		handleNotAllowed(w, []string{http.MethodGet})
		return
	}

	user, err := handler.UserService.User("admin")
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

	user := &portainer.User{
		Username: "admin",
	}
	user.Password, err = handler.CryptoService.Hash(req.Password)
	if err != nil {
		Error(w, portainer.ErrCryptoHashFailure, http.StatusBadRequest, handler.Logger)
		return
	}

	err = handler.UserService.UpdateUser(user)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

type postAdminInitRequest struct {
	Password string `valid:"required"`
}
