package stacks

type cloneRepositoryParameters struct {
	url            string
	referenceName  string
	path           string
	authentication bool
	deploymentKey  string
	username       string
	password       string
}

func (handler *Handler) cloneGitRepository(parameters *cloneRepositoryParameters) error {
	if parameters.authentication && parameters.username != "" && parameters.password != "" {
		return handler.GitService.ClonePrivateRepositoryWithBasicAuth(parameters.url, parameters.referenceName, parameters.path, parameters.username, parameters.password)
	}
	if parameters.authentication && parameters.deploymentKey != "" {
		deploymentKey, _ := handler.DeploymentKeyService.DeploymentKeyByName(parameters.deploymentKey)
		return handler.GitService.ClonePrivateRepositoryWithDeploymentKey(parameters.url, parameters.referenceName, parameters.path, deploymentKey.PrivateKey)
	}
	return handler.GitService.ClonePublicRepository(parameters.url, parameters.referenceName, parameters.path)
}
