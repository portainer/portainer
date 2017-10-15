package exec

import (
	"bytes"
	"os/exec"
	"path"
	"runtime"

	"github.com/portainer/portainer"
)

// StackManager represents a service for managing stacks.
type StackManager struct {
	binaryPath string
}

// NewStackManager initializes a new StackManager service.
func NewStackManager(binaryPath string) *StackManager {
	return &StackManager{
		binaryPath: binaryPath,
	}
}

// Deploy will execute the Docker stack deploy command
func (manager *StackManager) Deploy(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	stackFilePath := path.Join(stack.ProjectPath, stack.EntryPoint)
	command, args := prepareDockerCommandAndArgs(manager.binaryPath, endpoint)
	args = append(args, "stack", "deploy", "--with-registry-auth", "--compose-file", stackFilePath, stack.Name)
	return runCommandAndCaptureStdErr(command, args)
}

// Remove will execute the Docker stack rm command
func (manager *StackManager) Remove(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	command, args := prepareDockerCommandAndArgs(manager.binaryPath, endpoint)
	args = append(args, "stack", "rm", stack.Name)
	return runCommandAndCaptureStdErr(command, args)
}

func runCommandAndCaptureStdErr(command string, args []string) error {
	var stderr bytes.Buffer
	cmd := exec.Command(command, args...)
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return portainer.Error(stderr.String())
	}

	return nil
}

func prepareDockerCommandAndArgs(binaryPath string, endpoint *portainer.Endpoint) (string, []string) {
	// Assume Linux as a default
	command := path.Join(binaryPath, "docker")

	if runtime.GOOS == "windows" {
		command = path.Join(binaryPath, "docker.exe")
	}

	args := make([]string, 0)
	args = append(args, "-H", endpoint.URL)

	if endpoint.TLSConfig.TLS {
		args = append(args, "--tls")

		if !endpoint.TLSConfig.TLSSkipVerify {
			args = append(args, "--tlsverify", "--tlscacert", endpoint.TLSConfig.TLSCACertPath)
		}

		if endpoint.TLSConfig.TLSCertPath != "" && endpoint.TLSConfig.TLSKeyPath != "" {
			args = append(args, "--tlscert", endpoint.TLSConfig.TLSCertPath, "--tlskey", endpoint.TLSConfig.TLSKeyPath)
		}
	}

	return command, args
}
