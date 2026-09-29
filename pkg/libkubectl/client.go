package libkubectl

import (
	"bytes"
	"errors"
	"fmt"
	"net/url"

	"k8s.io/cli-runtime/pkg/genericclioptions"
	"k8s.io/cli-runtime/pkg/genericiooptions"
	"k8s.io/kubectl/pkg/cmd/util"
)

// InClusterServerURL is the well-known address of the Kubernetes API server
// reachable from inside the cluster.
const InClusterServerURL = "https://kubernetes.default.svc"

// InClusterCAFile is the CA bundle every pod gets mounted alongside its
// service account token, used to verify InClusterServerURL.
const InClusterCAFile = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"

type ClientAccess struct {
	Token     string
	ServerUrl string
	CAFile    string
}

// NewClientAccess builds the ClientAccess for serverURL: the Portainer agent
// proxy has no verifiable certificate, so verification is skipped for it.
// Anything else, including the in-cluster endpoint, is verified against the
// service account CA bundle, so an unexpected serverURL fails closed instead
// of silently skipping verification.
func NewClientAccess(serverURL, token string) (access *ClientAccess, insecure bool) {
	caFile, insecure := ClientAccessFor(serverURL)

	return &ClientAccess{
		Token:     token,
		ServerUrl: serverURL,
		CAFile:    caFile,
	}, insecure
}

// ClientAccessFor reports how a kubectl client should verify serverURL: the
// Portainer agent proxy has no verifiable certificate, so verification is
// skipped for it. Anything else, including the in-cluster endpoint, is
// verified against the service account CA bundle, so an unexpected serverURL
// fails closed instead of silently skipping verification.
func ClientAccessFor(serverURL string) (caFile string, insecure bool) {
	if isPortainerProxyURL(serverURL) {
		return "", true
	}

	return InClusterCAFile, false
}

// isPortainerProxyURL reports whether serverURL is the loopback HTTP proxy
// the Kubernetes deployer talks through when it cannot reach the API server
// directly, the only endpoint that presents no verifiable certificate.
func isPortainerProxyURL(serverURL string) bool {
	parsed, err := url.Parse(serverURL)
	if err != nil {
		return false
	}

	return parsed.Scheme == "http" && parsed.Hostname() == "127.0.0.1"
}

type Client struct {
	factory util.Factory
	streams genericclioptions.IOStreams
	out     *bytes.Buffer
}

// NewClient creates a new kubectl client
func NewClient(libKubectlAccess *ClientAccess, namespace, kubeconfig string, insecure bool) (*Client, error) {
	configFlags, err := generateConfigFlags(libKubectlAccess.Token, libKubectlAccess.ServerUrl, libKubectlAccess.CAFile, namespace, kubeconfig, insecure)
	if err != nil {
		return nil, err
	}

	streams, _, out, _ := genericiooptions.NewTestIOStreams()

	return &Client{
		factory: util.NewFactory(configFlags),
		streams: streams,
		out:     out,
	}, nil
}

// generateConfigFlags generates the config flags for the kubectl client
// If kubeconfigPath is provided, it will be used instead of server and token
// If server and token are provided, they will be used to connect to the cluster
// If neither kubeconfigPath or server and token are provided, an error will be returned
func generateConfigFlags(token, server, caFile, namespace, kubeconfigPath string, insecure bool) (*genericclioptions.ConfigFlags, error) {
	if kubeconfigPath == "" && server == "" {
		return nil, errors.New("must provide either a kubeconfig path or a server")
	}

	// Pass 'false' to usePersistentConfig to prevent memory leaks.
	configFlags := genericclioptions.NewConfigFlags(false)
	if namespace != "" {
		configFlags.Namespace = &namespace
	}

	if kubeconfigPath != "" {
		configFlags.KubeConfig = &kubeconfigPath
	} else {
		configFlags.APIServer = &server
		configFlags.BearerToken = &token
	}

	if caFile != "" {
		configFlags.CAFile = &caFile
	}

	configFlags.Insecure = &insecure

	return configFlags, nil
}

func newKubectlFatalError(code int, msg string) error {
	return fmt.Errorf("kubectl fatal error (exit code %d): %s", code, msg)
}
