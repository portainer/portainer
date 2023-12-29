import { transformGitAuthenticationViewModel } from '@/react/portainer/gitops/AuthFieldset/utils';
import { GitFormModel } from '@/react/portainer/gitops/types';

export function toGitRequest(
  gitConfig: GitFormModel,
  credentialId: number | undefined
): GitFormModel {
  return {
    ...gitConfig,
    ...getGitAuthValues(gitConfig, credentialId),
  };
}

function getGitAuthValues(
  gitConfig: GitFormModel | undefined,
  credentialId: number | undefined
) {
  if (!credentialId) {
    return gitConfig;
  }

  const authModel = transformGitAuthenticationViewModel({
    ...gitConfig,
    RepositoryGitCredentialID: credentialId,
  });

  return authModel
    ? {
        RepositoryAuthentication: true,
        RepositoryGitCredentialID: authModel.GitCredentialID,
        RepositoryPassword: authModel.Password,
        RepositoryUsername: authModel.Username,
      }
    : {};
}
