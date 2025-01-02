export type AutoUpdateMechanism = 'Webhook' | 'Interval';
export { type RelativePathModel } from './RelativePathFieldset/types';

export interface AutoUpdateResponse {
  /* Auto update interval */
  Interval: string;

  /* A UUID generated from client */
  Webhook: string;

  /* Force update ignores repo changes */
  ForceUpdate: boolean;

  /* Pull latest image */
  ForcePullImage: boolean;
}

export interface GitAuthenticationResponse {
  Username?: string;
  Password?: string;
  GitCredentialID?: number;
}

export interface RepoConfigResponse {
  URL: string;
  ReferenceName: string;
  ConfigFilePath: string;
  Authentication?: GitAuthenticationResponse;
  ConfigHash: string;
  TLSSkipVerify: boolean;
}

export type AutoUpdateModel = {
  RepositoryAutomaticUpdates: boolean;
  RepositoryMechanism: AutoUpdateMechanism;
  RepositoryFetchInterval: string;
  ForcePullImage: boolean;
  RepositoryAutomaticUpdatesForce: boolean;
};

export type GitCredentialsModel = {
  RepositoryAuthentication?: boolean;
  RepositoryUsername?: string;
  RepositoryPassword?: string;
  RepositoryGitCredentialID?: number;
};

export type GitNewCredentialModel = {
  NewCredentialName?: string;
  SaveCredential?: boolean;
};

export type GitAuthModel = GitCredentialsModel & GitNewCredentialModel;

export type DeployMethod = 'compose' | 'manifest';

export interface GitFormModel extends GitAuthModel {
  RepositoryURL: string;
  RepositoryURLValid?: boolean;
  ComposeFilePathInRepository: string;
  RepositoryReferenceName?: string;
  AdditionalFiles?: string[];

  TLSSkipVerify?: boolean;

  /**
   * Auto update
   *
   * if undefined, GitForm won't show the AutoUpdate fieldset
   */
  AutoUpdate?: AutoUpdateModel;
}

export function toGitFormModel(
  response?: RepoConfigResponse,
  autoUpdate?: AutoUpdateModel
): GitFormModel {
  if (!response) {
    return {
      RepositoryURL: '',
      ComposeFilePathInRepository: '',
      RepositoryAuthentication: false,
      TLSSkipVerify: false,
      AutoUpdate: autoUpdate,
    };
  }

  const { URL, ReferenceName, ConfigFilePath, Authentication, TLSSkipVerify } =
    response;

  return {
    RepositoryURL: URL,
    ComposeFilePathInRepository: ConfigFilePath,
    RepositoryReferenceName: ReferenceName,
    RepositoryAuthentication: !!(
      Authentication &&
      (Authentication?.GitCredentialID || Authentication?.Username)
    ),
    RepositoryUsername: Authentication?.Username,
    RepositoryPassword: Authentication?.Password,
    RepositoryGitCredentialID: Authentication?.GitCredentialID,
    TLSSkipVerify,
    AutoUpdate: autoUpdate,
  };
}
