package stacks

type cloneRepositoryParameters struct {
	url            string
	path           string
	authentication bool
	username       string
	password       string
}

func (handler *StackHandler) cloneGitRepository(parameters *cloneRepositoryParameters) error {
	if parameters.authentication {
		return handler.GitService.ClonePrivateRepositoryWithBasicAuth(parameters.url, parameters.path, parameters.username, parameters.password)
	}
	return handler.GitService.ClonePublicRepository(parameters.url, parameters.path)
}
