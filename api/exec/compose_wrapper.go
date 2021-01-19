package exec

import (
	"bytes"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy"
)

// ComposeWrapper is a wrapper for docker-compose binary
type ComposeWrapper struct {
	binaryPath   string
	proxyManager proxy.Manager
}

// NewComposeWrapper returns a docker-compose wrapper if corresponding binary present, otherwise nil
func NewComposeWrapper(binaryPath string, proxyManager proxy.Manager) *ComposeWrapper {
	if !IsBinaryPresent(programPath(binaryPath, "docker-compose")) {
		return nil
	}

	return &ComposeWrapper{
		binaryPath:   binaryPath,
		proxyManager: proxyManager,
	}
}

// Up builds, (re)creates and starts containers in the background. Wraps `docker-compose up -d` command
func (w *ComposeWrapper) Up(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	_, err := w.command([]string{"up", "-d"}, stack, endpoint)
	return err
}

// Down stops and removes containers, networks, images, and volumes. Wraps `docker-compose down --remove-orphans` command
func (w *ComposeWrapper) Down(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	_, err := w.command([]string{"down", "--remove-orphans"}, stack, endpoint)
	return err
}

func (w *ComposeWrapper) command(command []string, stack *portainer.Stack, endpoint *portainer.Endpoint) ([]byte, error) {
	program := programPath(w.binaryPath, "docker-compose")

	options := setComposeFile(stack)

	options = addProjectNameOption(options, stack)
	options, err := addEnvFileOption(options, stack)
	if err != nil {
		return nil, err
	}

	if endpoint != nil {

		if endpoint.URL != "" && !(strings.HasPrefix(endpoint.URL, "unix://") || strings.HasPrefix(endpoint.URL, "npipe://")) {
			proxy, err := w.proxyManager.CreateAndRegisterComposeEndpointProxy(endpoint)

			listener, err := net.Listen("tcp", ":0")
			if err != nil {
				return nil, err
			}
			log.Printf("Proxy Server: %v", proxy)
			server := http.Server{
				Handler: proxy,
			}

			shutdownChan := make(chan error, 1)
			port := listener.Addr().(*net.TCPAddr).Port
			go func() {
				log.Printf("Starting Proxy server on %s...\n", fmt.Sprintf("http://localhost:%d", port))
				// details are the same as for the `server.ListenAndServe()` section above
				err := server.Serve(listener)
				log.Printf("Proxy Server exited with '%v' error\n", err)

				if err != http.ErrServerClosed {
					log.Printf("Put '%v' error returned by Proxy Server to shutdown channel\n", err)
					shutdownChan <- err
				}
			}()

			defer server.Close()

			options = append(options, "-H", fmt.Sprintf("http://localhost:%d", port))
		}

	}

	// options = addTLSConnectionOptions(options, endpoint)

	args := append(options, command...)

	var stderr bytes.Buffer
	cmd := exec.Command(program, args...)
	cmd.Stderr = &stderr

	out, err := cmd.Output()
	if err != nil {
		return out, errors.New(stderr.String())
	}

	return out, nil
}

func setComposeFile(stack *portainer.Stack) []string {
	options := make([]string, 0)

	if stack == nil || stack.EntryPoint == "" {
		return options
	}

	composeFilePath := path.Join(stack.ProjectPath, stack.EntryPoint)
	options = append(options, "-f", composeFilePath)
	return options
}

func addTLSConnectionOptions(options []string, endpoint *portainer.Endpoint) []string {
	if endpoint.TLSConfig.TLS {
		options = append(options, "--tls")

		if !endpoint.TLSConfig.TLSSkipVerify {
			options = append(options, "--tlsverify", "--tlscacert", endpoint.TLSConfig.TLSCACertPath)
		}

		if endpoint.TLSConfig.TLSCertPath != "" && endpoint.TLSConfig.TLSKeyPath != "" {
			options = append(options, "--tlscert", endpoint.TLSConfig.TLSCertPath, "--tlskey", endpoint.TLSConfig.TLSKeyPath)
		}
	}

	return options
}

func addConnectionOptions(options []string, endpoint *portainer.Endpoint) []string {
	if endpoint == nil {
		return options
	}

	if endpoint.URL != "" {
		options = append(options, "-H", endpoint.URL)
	}

	if endpoint.TLSConfig.TLS {
		options = append(options, "--tls")

		if !endpoint.TLSConfig.TLSSkipVerify {
			options = append(options, "--tlsverify", "--tlscacert", endpoint.TLSConfig.TLSCACertPath)
		}

		if endpoint.TLSConfig.TLSCertPath != "" && endpoint.TLSConfig.TLSKeyPath != "" {
			options = append(options, "--tlscert", endpoint.TLSConfig.TLSCertPath, "--tlskey", endpoint.TLSConfig.TLSKeyPath)
		}
	}

	return options
}

func addProjectNameOption(options []string, stack *portainer.Stack) []string {
	if stack == nil || stack.Name == "" {
		return options
	}

	options = append(options, "-p", stack.Name)
	return options
}

func addEnvFileOption(options []string, stack *portainer.Stack) ([]string, error) {
	if stack == nil || stack.Env == nil || len(stack.Env) == 0 {
		return options, nil
	}

	envFilePath := path.Join(stack.ProjectPath, "stack.env")

	envfile, err := os.OpenFile(envFilePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return options, err
	}

	for _, v := range stack.Env {
		envfile.WriteString(fmt.Sprintf("%s=%s\n", v.Name, v.Value))
	}
	envfile.Close()

	options = append(options, "--env-file", envFilePath)
	return options, nil
}
