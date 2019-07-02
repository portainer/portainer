package stacks

type cloneRepositoryParameters struct {
	url                string
	referenceName      string
	path               string
	authenticationType string
	deploymentKey      []byte
	username           string
	password           string
}

func (handler *Handler) cloneGitRepository(parameters *cloneRepositoryParameters) error {
	if parameters.authenticationType != "" && parameters.username != "" && parameters.password != "" {
		return handler.GitService.ClonePrivateRepositoryWithBasicAuth(parameters.url, parameters.referenceName, parameters.path, parameters.username, parameters.password)
	}
	if parameters.authenticationType != "" && parameters.deploymentKey != nil {
		return handler.GitService.ClonePrivateRepositoryWithDeploymentKey(parameters.url, parameters.referenceName, parameters.path, parameters.deploymentKey)
	}
	return handler.GitService.ClonePublicRepository(parameters.url, parameters.referenceName, parameters.path)
}
