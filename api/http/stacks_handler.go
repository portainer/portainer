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
  "io/ioutil"

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
	h.PathPrefix("/{id}/{stack}").Methods("POST").Handler(
		mw.authenticated(http.HandlerFunc(h.executeDockerStackDeploy)))
	h.PathPrefix("/{id}/{stack}").Methods("DELETE").Handler(
		mw.authenticated(http.HandlerFunc(h.executeDockerStackRm)))
	return h
}

func (handler *StacksHandler) executeDockerStackRm(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	stack := vars["stack"]

	parsedID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpointID := portainer.EndpointID(parsedID)
	endpoint, _ := handler.EndpointService.Endpoint(endpointID)

  cmd := exec.Command("/docker", "-H", endpoint.URL, "stack", "rm", stack)

  var out bytes.Buffer
  cmd.Stdout = &out
  cmd.Stderr = &out
  err = cmd.Run()

  fmt.Fprintln(w, out.String())
  fmt.Fprintln(w, "err: ", err)
}

func (handler *StacksHandler) executeDockerStackDeploy(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	stack := vars["stack"]

  // Get Body (compose-file)
  body, _ := ioutil.ReadAll(r.Body)

  // Place body in tempfile
  tmpfile, err := ioutil.TempFile("/", "portainer_compose_file_")
  defer os.Remove(tmpfile.Name())
  tmpfile.Write(body)

	parsedID, err := strconv.Atoi(id)
	if err != nil {
		Error(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpointID := portainer.EndpointID(parsedID)
	endpoint, _ := handler.EndpointService.Endpoint(endpointID)

  cmd := exec.Command("/docker", "-H", endpoint.URL, "stack", "deploy", "--compose-file", tmpfile.Name(), stack)

  var out bytes.Buffer
  cmd.Stdout = &out
  cmd.Stderr = &out
  err = cmd.Run()

  fmt.Fprintln(w, out.String())
  fmt.Fprintln(w, "err: ", err)

  tmpfile.Close()
}
