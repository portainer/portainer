package cli

import (
	"errors"
	"io"

	v1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/remotecommand"
	utilexec "k8s.io/client-go/util/exec"
)

// StartExecProcess will start an exec process inside a container located inside a pod inside a specific namespace
// using the specified command. The stdin parameter will be bound to the stdin process and the stdout process will write
// to the stdout parameter.
// This function only works against a local environment(endpoint) using an in-cluster config with the user's SA token.
// This is a blocking operation.
func (kcl *KubeClient) StartExecProcess(token string, useAdminToken bool, namespace, podName, containerName string, command []string, stdin io.Reader, stdout io.Writer, errChan chan error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		errChan <- err
		return
	}

	if !useAdminToken {
		config.BearerToken = token
		config.BearerTokenFile = ""
	}

	req := kcl.cli.CoreV1().RESTClient().
		Post().
		Resource("pods").
		Name(podName).
		Namespace(namespace).
		SubResource("exec")

	req.VersionedParams(&v1.PodExecOptions{
		Container: containerName,
		Command:   command,
		Stdin:     true,
		Stdout:    true,
		Stderr:    true,
		TTY:       true,
	}, scheme.ParameterCodec)

	exec, err := remotecommand.NewSPDYExecutor(config, "POST", req.URL())
	if err != nil {
		errChan <- err
		return
	}

	err = exec.Stream(remotecommand.StreamOptions{
		Stdin:  stdin,
		Stdout: stdout,
		Tty:    true,
	})
	if err != nil {
		if _, ok := err.(utilexec.ExitError); !ok {
			errChan <- errors.New("unable to start exec process")
		}
	}
}
