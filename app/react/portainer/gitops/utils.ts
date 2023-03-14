import { GitFormModel } from './types';

export function getAuthentication(
  model: Pick<
    GitFormModel,
    | 'RepositoryAuthentication'
    | 'RepositoryPassword'
    | 'RepositoryUsername'
    | 'RepositoryGitCredentialID'
  >
) {
  if (model.RepositoryGitCredentialID) {
    return { gitCredentialId: model.RepositoryGitCredentialID };
  }

  return {
    username: model.RepositoryUsername,
    password: model.RepositoryPassword,
  };
}
