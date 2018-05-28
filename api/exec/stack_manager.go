package exec

import (
	"bytes"
	"encoding/json"
	"os"
	"os/exec"
	"path"
	"runtime"

	"github.com/portainer/portainer"
)

// StackManager represents a service for managing stacks.
type StackManager struct {
	binaryPath       string
	dataPath         string
	signatureService portainer.DigitalSignatureService
	fileService      portainer.FileService
}

// NewStackManager initializes a new StackManager service.
// It also updates the configuration of the Docker CLI binary.
func NewStackManager(binaryPath, dataPath string, signatureService portainer.DigitalSignatureService, fileService portainer.FileService) (*StackManager, error) {
	manager := &StackManager{
		binaryPath:       binaryPath,
		dataPath:         dataPath,
		signatureService: signatureService,
		fileService:      fileService,
	}

	err := manager.updateDockerCLIConfiguration(dataPath)
	if err != nil {
		return nil, err
	}

	return manager, nil
}

// Login executes the docker login command against a list of registries (including DockerHub).
func (manager *StackManager) Login(dockerhub *portainer.DockerHub, registries []portainer.Registry, endpoint *portainer.Endpoint) {
	command, args := prepareDockerCommandAndArgs(manager.binaryPath, manager.dataPath, endpoint)
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
	command, args := prepareDockerCommandAndArgs(manager.binaryPath, manager.dataPath, endpoint)
	args = append(args, "logout")
	return runCommandAndCaptureStdErr(command, args, nil, "")
}

// Deploy executes the docker stack deploy command.
func (manager *StackManager) Deploy(stack *portainer.Stack, prune bool, endpoint *portainer.Endpoint) error {
	err := manager.updateDockerCLIConfiguration(manager.binaryPath)
	if err != nil {
		return err
	}

	stackFilePath := path.Join(stack.ProjectPath, stack.EntryPoint)
	command, args := prepareDockerCommandAndArgs(manager.binaryPath, manager.dataPath, endpoint)

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
	command, args := prepareDockerCommandAndArgs(manager.binaryPath, manager.dataPath, endpoint)
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

func prepareDockerCommandAndArgs(binaryPath, dataPath string, endpoint *portainer.Endpoint) (string, []string) {
	// Assume Linux as a default
	command := path.Join(binaryPath, "docker")

	if runtime.GOOS == "windows" {
		command = path.Join(binaryPath, "docker.exe")
	}

	args := make([]string, 0)
	args = append(args, "--config", dataPath)
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

func (manager *StackManager) updateDockerCLIConfiguration(dataPath string) error {
	configFilePath := path.Join(dataPath, "config.json")
	config, err := manager.retrieveConfigurationFromDisk(configFilePath)
	if err != nil {
		return err
	}

	signature, err := manager.signatureService.Sign(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return err
	}

	if config["HttpHeaders"] == nil {
		config["HttpHeaders"] = make(map[string]interface{})
	}
	headersObject := config["HttpHeaders"].(map[string]interface{})
	headersObject["X-PortainerAgent-ManagerOperation"] = "1"
	headersObject["X-PortainerAgent-Signature"] = signature
	headersObject["X-PortainerAgent-PublicKey"] = manager.signatureService.EncodedPublicKey()

	err = manager.fileService.WriteJSONToFile(configFilePath, config)
	if err != nil {
		return err
	}

	return nil
}

func (manager *StackManager) retrieveConfigurationFromDisk(path string) (map[string]interface{}, error) {
	var config map[string]interface{}

	raw, err := manager.fileService.GetFileContent(path)
	if err != nil {
		return make(map[string]interface{}), nil
	}

	err = json.Unmarshal([]byte(raw), &config)
	if err != nil {
		return nil, err
	}

	return config, nil
}
