package libkubectl

import (
	"bytes"
	"errors"
	"fmt"

	"k8s.io/cli-runtime/pkg/genericclioptions"
	"k8s.io/cli-runtime/pkg/genericiooptions"
	"k8s.io/kubectl/pkg/cmd/util"
)

type ClientAccess struct {
	Token     string
	ServerUrl string
}

type Client struct {
	factory util.Factory
	streams genericclioptions.IOStreams
	out     *bytes.Buffer
}

// NewClient creates a new kubectl client
func NewClient(libKubectlAccess *ClientAccess, namespace, kubeconfig string, insecure bool) (*Client, error) {
	configFlags, err := generateConfigFlags(libKubectlAccess.Token, libKubectlAccess.ServerUrl, namespace, kubeconfig, insecure)
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
func generateConfigFlags(token, server, namespace, kubeconfigPath string, insecure bool) (*genericclioptions.ConfigFlags, error) {
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

	configFlags.Insecure = &insecure

	return configFlags, nil
}

func newKubectlFatalError(code int, msg string) error {
	return fmt.Errorf("kubectl fatal error (exit code %d): %s", code, msg)
}
