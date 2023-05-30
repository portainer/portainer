export type AutoUpdateMechanism = 'Webhook' | 'Interval';

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
}

export type AutoUpdateModel = {
  RepositoryAutomaticUpdates: boolean;
  RepositoryMechanism: AutoUpdateMechanism;
  RepositoryFetchInterval: string;
  ForcePullImage: boolean;
  RepositoryAutomaticUpdatesForce: boolean;
};

export type GitCredentialsModel = {
  RepositoryAuthentication: boolean;
  RepositoryUsername?: string;
  RepositoryPassword?: string;
  RepositoryGitCredentialID?: number;
};

export type GitNewCredentialModel = {
  NewCredentialName?: string;
  SaveCredential?: boolean;
};

export type GitAuthModel = GitCredentialsModel & GitNewCredentialModel;

export interface GitFormModel extends GitAuthModel {
  RepositoryURL: string;
  RepositoryURLValid: boolean;
  ComposeFilePathInRepository: string;
  RepositoryAuthentication: boolean;
  RepositoryReferenceName?: string;
  AdditionalFiles: string[];

  SaveCredential?: boolean;
  NewCredentialName?: string;
  TLSSkipVerify: boolean;

  /**
   * Auto update
   *
   * if undefined, GitForm won't show the AutoUpdate fieldset
   */
  AutoUpdate?: AutoUpdateModel;
}
