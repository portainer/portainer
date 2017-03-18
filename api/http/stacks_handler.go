package http

import (
	"strconv"

	"github.com/portainer/portainer"

	"log"
	"net/http"
	//"net/url"
	"os"
  "fmt"
  "bytes"
  "os/exec"

	"github.com/gorilla/mux"
)

// StacksHandler represents an HTTP API handler for proxying requests to the Docker API.
type StacksHandler struct {
	*mux.Router
	Logger          *log.Logger
	EndpointService portainer.EndpointService
}

// NewStacksHandler returns a new instance of StacksHandler.
func NewStacksHandler(mw *middleWareService, resourceControlService portainer.ResourceControlService) *StacksHandler {
	h := &StacksHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.PathPrefix("/{id}/{stack}/{command}").Handler(
		mw.authenticated(http.HandlerFunc(h.executeDockerStackCommand)))
	return h
}

func (handler *StacksHandler) executeDockerStackCommand(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	stack := vars["stack"]
  command := vars["command"]

	parsedID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpointID := portainer.EndpointID(parsedID)
	endpoint, _ := handler.EndpointService.Endpoint(endpointID)

  cmd := exec.Command("/docker", "-H", endpoint.URL, "stack", command, stack)

  var out bytes.Buffer
  cmd.Stdout = &out
  cmd.Stderr = &out
  err = cmd.Run()

  fmt.Fprintln(w, out.String())
  fmt.Fprintln(w, "err: ", err)
}

