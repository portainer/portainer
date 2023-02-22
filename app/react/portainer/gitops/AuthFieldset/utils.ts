import { GitAuthenticationResponse, GitAuthModel } from '../types';

export function parseAuthResponse(
  auth?: GitAuthenticationResponse
): GitAuthModel {
  if (!auth) {
    return {
      RepositoryAuthentication: false,
      NewCredentialName: '',
      RepositoryGitCredentialID: 0,
      RepositoryPassword: '',
      RepositoryUsername: '',
      SaveCredential: false,
    };
  }

  return {
    RepositoryAuthentication: true,
    NewCredentialName: '',
    RepositoryGitCredentialID: auth.GitCredentialID,
    RepositoryPassword: '',
    RepositoryUsername: auth.Username,
  };
}
