package http

import (
	"github.com/portainer/portainer"

	"encoding/json"
	"github.com/asaskevich/govalidator"
	"github.com/gorilla/mux"
	"log"
	"net/http"
	"os"
)

// AuthHandler represents an HTTP API handler for managing authentication.
type AuthHandler struct {
	*mux.Router
	Logger        *log.Logger
	UserService   portainer.UserService
	CryptoService portainer.CryptoService
	JWTService    portainer.JWTService
}

const (
	// ErrInvalidCredentialsFormat is an error raised when credentials format is not valid
	ErrInvalidCredentialsFormat = portainer.Error("Invalid credentials format")
	// ErrInvalidCredentials is an error raised when credentials for a user are invalid
	ErrInvalidCredentials = portainer.Error("Invalid credentials")
)

// NewAuthHandler returns a new instance of DialHandler.
func NewAuthHandler() *AuthHandler {
	h := &AuthHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.HandleFunc("/auth", h.handlePostAuth)
	return h
}

func (handler *AuthHandler) handlePostAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		handleNotAllowed(w, []string{"POST"})
		return
	}

	var req postAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Error(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err := govalidator.ValidateStruct(req)
	if err != nil {
		Error(w, ErrInvalidCredentialsFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	var username = req.Username
	var password = req.Password

	u, err := handler.UserService.User(username)
	if err == portainer.ErrUserNotFound {
		Error(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.CryptoService.CompareHashAndData(u.Password, password)
	if err != nil {
		Error(w, ErrInvalidCredentials, http.StatusUnprocessableEntity, handler.Logger)
		return
	}

	tokenData := &portainer.TokenData{
		username,
	}
	token, err := handler.JWTService.GenerateToken(tokenData)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postAuthResponse{JWT: token}, handler.Logger)
}

type postAuthRequest struct {
	Username string `valid:"alphanum,required"`
	Password string `valid:"required"`
}

type postAuthResponse struct {
	JWT string `json:"jwt"`
}
