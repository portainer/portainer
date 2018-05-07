package exec

import (
	"bytes"
	"os"
	"os/exec"
	"path"
	"runtime"

	"github.com/portainer/portainer"
)

// StackManager represents a service for managing stacks.
type StackManager struct {
	binaryPath       string
	signatureService portainer.DigitalSignatureService
	fileService      portainer.FileService
}

type dockerCLIConfiguration struct {
	HTTPHeaders struct {
		ManagerOperationHeader string `json:"X-PortainerAgent-ManagerOperation"`
		SignatureHeader        string `json:"X-PortainerAgent-Signature"`
		PublicKey              string `json:"X-PortainerAgent-PublicKey"`
	} `json:"HttpHeaders"`
}

// NewStackManager initializes a new StackManager service.
// It also updates the configuration of the Docker CLI binary.
func NewStackManager(binaryPath string, signatureService portainer.DigitalSignatureService, fileService portainer.FileService) (*StackManager, error) {
	manager := &StackManager{
		binaryPath:       binaryPath,
		signatureService: signatureService,
		fileService:      fileService,
	}

	err := manager.updateDockerCLIConfiguration(binaryPath)
	if err != nil {
		return nil, err
	}

	return manager, nil
}

// Login executes the docker login command against a list of registries (including DockerHub).
func (manager *StackManager) Login(dockerhub *portainer.DockerHub, registries []portainer.Registry, endpoint *portainer.Endpoint) {
	command, args := prepareDockerCommandAndArgs(manager.binaryPath, endpoint)
	for _, registry := range registries {
		if registry.Authentication {
			registryArgs := append(args, "login", "--username", registry.Username, "--password", registry.Password, registry.URL)
			runCommandAndCaptureStdErr(command, registryArgs, nil, "")
		}
	}

	if dockerhub.Authentication {
		dockerhubArgs := append(args, "login", "--username", dockerhub.Username, "--password", dockerhub.Password)
		runCommandAndCaptureStdErr(command, dockerhubArgs, nil, "")
	}
}

// Logout executes the docker logout command.
func (manager *StackManager) Logout(endpoint *portainer.Endpoint) error {
	command, args := prepareDockerCommandAndArgs(manager.binaryPath, endpoint)
	args = append(args, "logout")
	return runCommandAndCaptureStdErr(command, args, nil, "")
}

// Deploy executes the docker stack deploy command.
func (manager *StackManager) Deploy(stack *portainer.Stack, prune bool, endpoint *portainer.Endpoint) error {
	stackFilePath := path.Join(stack.ProjectPath, stack.EntryPoint)
	command, args := prepareDockerCommandAndArgs(manager.binaryPath, endpoint)

	if prune {
		args = append(args, "stack", "deploy", "--prune", "--with-registry-auth", "--compose-file", stackFilePath, stack.Name)
	} else {
		args = append(args, "stack", "deploy", "--with-registry-auth", "--compose-file", stackFilePath, stack.Name)
	}

	env := make([]string, 0)
	for _, envvar := range stack.Env {
		env = append(env, envvar.Name+"="+envvar.Value)
	}

	stackFolder := path.Dir(stackFilePath)
	return runCommandAndCaptureStdErr(command, args, env, stackFolder)
}

// Remove executes the docker stack rm command.
func (manager *StackManager) Remove(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	command, args := prepareDockerCommandAndArgs(manager.binaryPath, endpoint)
	args = append(args, "stack", "rm", stack.Name)
	return runCommandAndCaptureStdErr(command, args, nil, "")
}

func runCommandAndCaptureStdErr(command string, args []string, env []string, workingDir string) error {
	var stderr bytes.Buffer
	cmd := exec.Command(command, args...)
	cmd.Stderr = &stderr
	cmd.Dir = workingDir

	if env != nil {
		cmd.Env = os.Environ()
		cmd.Env = append(cmd.Env, env...)
	}

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
	args = append(args, "--config", binaryPath)
	args = append(args, "-H", endpoint.URL)

	if !endpoint.TLSConfig.TLS && endpoint.TLSConfig.TLSSkipVerify {
		args = append(args, "--tls")
	} else if endpoint.TLSConfig.TLS {
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

func (manager *StackManager) updateDockerCLIConfiguration(binaryPath string) error {
	config := dockerCLIConfiguration{}
	config.HTTPHeaders.ManagerOperationHeader = "1"

	signature, err := manager.signatureService.Sign(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return err
	}
	config.HTTPHeaders.SignatureHeader = signature
	config.HTTPHeaders.PublicKey = manager.signatureService.EncodedPublicKey()

	err = manager.fileService.WriteJSONToFile(path.Join(binaryPath, "config.json"), config)
	if err != nil {
		return err
	}

	return nil
}
