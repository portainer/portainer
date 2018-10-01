package stacks

type cloneRepositoryParameters struct {
	url            string
	referenceName  string
	path           string
	authentication bool
	stackAuthenticationEnabled string
	username       string
	password       string
	privatekeypath string
	publickeypath  string
}

func (handler *Handler) cloneGitRepository(parameters *cloneRepositoryParameters) error {
	/*if (parameters.authentication == "2")  {
		return handler.GitService.ClonePrivateRepositoryWithBasicAuth(parameters.url, parameters.referenceName, parameters.path, parameters.username, parameters.password)
	} else if (parameters.authentication == "1") {
		return handler.GitService.ClonePrivateRepositoryWithDeploykeyAuth(parameters.url, parameters.referenceName, parameters.path, parameters.publickeypath, parameters.privatekeypath)
	} else {
		return handler.GitService.ClonePublicRepository(parameters.url, parameters.referenceName, parameters.path)
	}*/
	if parameters.authentication {
		if (parameters.stackAuthenticationEnabled == "2")  {
			return handler.GitService.ClonePrivateRepositoryWithBasicAuth(parameters.url, parameters.referenceName, parameters.path, parameters.username, parameters.password)
		} else if (parameters.stackAuthenticationEnabled == "1") {
			return handler.GitService.ClonePrivateRepositoryWithDeploykeyAuth(parameters.url, parameters.referenceName, parameters.path, parameters.publickeypath, parameters.privatekeypath)
		}
		//return handler.GitService.ClonePrivateRepositoryWithBasicAuth(parameters.url, parameters.referenceName, parameters.path, parameters.username, parameters.password)
	}
	return handler.GitService.ClonePublicRepository(parameters.url, parameters.referenceName, parameters.path)	
}
