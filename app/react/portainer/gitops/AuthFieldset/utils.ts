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

export function transformGitAuthenticationViewModel(
  auth?: GitAuthModel
): GitAuthenticationResponse | null {
  if (
    !auth ||
    !auth.RepositoryAuthentication ||
    typeof auth.RepositoryGitCredentialID === 'undefined' ||
    (auth.RepositoryGitCredentialID === 0 && auth.RepositoryPassword === '')
  ) {
    return null;
  }

  if (auth.RepositoryGitCredentialID !== 0) {
    return {
      GitCredentialID: auth.RepositoryGitCredentialID,
    };
  }

  return {
    Username: auth.RepositoryUsername,
    Password: auth.RepositoryPassword,
  };
}
