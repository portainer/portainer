package stacks

type cloneRepositoryParameters struct {
	url            string
	referenceName  string
	path           string
	authentication bool
	username       string
	password       string
}

func (handler *Handler) cloneGitRepository(parameters *cloneRepositoryParameters) error {
	if parameters.authentication {
		return handler.GitService.ClonePrivateRepositoryWithBasicAuth(parameters.url, parameters.referenceName, parameters.path, parameters.username, parameters.password)
	}
	return handler.GitService.ClonePublicRepository(parameters.url, parameters.referenceName, parameters.path)
}
