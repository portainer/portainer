package cli

import (
	"context"
	"errors"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
	v1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/remotecommand"
	utilexec "k8s.io/client-go/util/exec"
)

var (
	channelProtocolList = []string{
		"v5.channel.k8s.io",
		"v4.channel.k8s.io",
		"v3.channel.k8s.io",
		"v2.channel.k8s.io",
		"channel.k8s.io",
	}
)

// StartExecProcess starts an exec process inside a container using an in-cluster config.
// This is a blocking operation.
func (kcl *KubeClient) StartExecProcess(params portainer.KubeExecParams) {
	config, err := rest.InClusterConfig()
	if err != nil {
		params.ErrChan <- err
		return
	}

	if !params.UseAdminToken {
		config.BearerToken = params.Token
		config.BearerTokenFile = ""
	}

	req := kcl.cli.CoreV1().RESTClient().
		Post().
		Resource("pods").
		Name(params.PodName).
		Namespace(params.Namespace).
		SubResource("exec")

	req.VersionedParams(&v1.PodExecOptions{
		Container: params.ContainerName,
		Command:   params.Command,
		Stdin:     true,
		Stdout:    true,
		Stderr:    true,
		TTY:       true,
	}, scheme.ParameterCodec)

	streamOpts := remotecommand.StreamOptions{
		Stdin:             params.Stdin,
		Stdout:            params.Stdout,
		Tty:               true,
		TerminalSizeQueue: params.ResizeQueue,
	}

	// Try WebSocket executor first, fall back to SPDY if it fails
	exec, err := remotecommand.NewWebSocketExecutorForProtocols(
		config,
		"GET", // WebSocket uses GET for the upgrade request
		req.URL().String(),
		channelProtocolList...,
	)
	if err == nil {
		err = exec.StreamWithContext(context.TODO(), streamOpts)
		if err == nil {
			params.ErrChan <- nil
			return
		}

		log.Warn().
			Err(err).
			Str("context", "StartExecProcess").
			Msg("WebSocket exec failed, falling back to SPDY")
	}

	// Fall back to SPDY executor
	exec, err = remotecommand.NewSPDYExecutor(config, "POST", req.URL())
	if err != nil {
		params.ErrChan <- fmt.Errorf("unable to create SPDY executor: %w", err)
		return
	}

	err = exec.StreamWithContext(context.TODO(), streamOpts)
	if err != nil {
		var exitError utilexec.ExitError
		if !errors.As(err, &exitError) {
			params.ErrChan <- fmt.Errorf("unable to start exec process: %w", err)
			return
		}
	}

	params.ErrChan <- nil
}
