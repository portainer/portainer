package client

import (
	"crypto/tls"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/portainer/portainer/api"
)

const (
	errInvalidResponseStatus = portainer.Error("Invalid response status (expecting 200)")
	defaultHTTPTimeout       = 5
)

// Get executes a simple HTTP GET to the specified URL and returns
// the content of the response body. Timeout can be specified via the timeout parameter,
// will default to defaultHTTPTimeout if set to 0.
func Get(url string, timeout int) ([]byte, error) {

	if timeout == 0 {
		timeout = defaultHTTPTimeout
	}

	client := &http.Client{
		Timeout: time.Second * time.Duration(timeout),
	}

	response, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		log.Printf("[ERROR] [http,client] [message: unexpected status code] [status_code: %d]", response.StatusCode)
		return nil, errInvalidResponseStatus
	}

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}

// ExecutePingOperation will send a SystemPing operation HTTP request to a Docker environment
// using the specified host and optional TLS configuration.
// It uses a new Http.Client for each operation.
func ExecutePingOperation(host string, tlsConfig *tls.Config) (bool, error) {
	transport := &http.Transport{}

	scheme := "http"
	if tlsConfig != nil {
		transport.TLSClientConfig = tlsConfig
		scheme = "https"
	}

	client := &http.Client{
		Timeout:   time.Second * 3,
		Transport: transport,
	}

	target := strings.Replace(host, "tcp://", scheme+"://", 1)
	return pingOperation(client, target)
}

func pingOperation(client *http.Client, target string) (bool, error) {
	pingOperationURL := target + "/_ping"

	response, err := client.Get(pingOperationURL)
	if err != nil {
		return false, err
	}

	agentOnDockerEnvironment := false
	if response.Header.Get(portainer.PortainerAgentHeader) != "" {
		agentOnDockerEnvironment = true
	}

	return agentOnDockerEnvironment, nil
}
