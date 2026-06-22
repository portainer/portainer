import { AuthTypeOption } from '@/react/portainer/account/git-credentials/types';

import {
  AutoUpdateModel,
  getDefaultAutoUpdateValues,
} from './AutoUpdateFieldset/utils';

export type {
  AutoUpdateMechanism,
  AutoUpdateModel,
  AutoUpdateResponse,
} from './AutoUpdateFieldset/utils';

export { type RelativePathModel } from './RelativePathFieldset/types';

export interface GitAuthenticationResponse {
  Username?: string;
  Password?: string;
  AuthorizationType?: AuthTypeOption;
}

export interface RepoConfigResponse {
  URL: string;
  ReferenceName: string;
  ConfigFilePath: string;
  Authentication?: GitAuthenticationResponse;
  ConfigHash: string;
  TLSSkipVerify: boolean;
}

export type DeployMethod = 'compose' | 'manifest' | 'helm';

export interface GitFormModel {
  SourceId?: number;
  ComposeFilePathInRepository?: string;
  RepositoryReferenceName?: string;
  AdditionalFiles?: string[];
  /**
   * Auto update
   *
   * if undefined, GitForm won't show the AutoUpdate fieldset
   */
  AutoUpdate?: AutoUpdateModel;

  /** Used to create stacks from app templates */
  RepositoryURL?: string;
}

export function getDefaultModel(
  autoUpdate: AutoUpdateModel = getDefaultAutoUpdateValues()
): GitFormModel {
  return {
    ComposeFilePathInRepository: 'docker-compose.yml',
    RepositoryReferenceName: 'refs/heads/main',
    AutoUpdate: autoUpdate,
    SourceId: 0,
  };
}

export function toGitFormModel(
  sourceId?: number,
  response?: Omit<
    RepoConfigResponse,
    'URL' | 'TLSSkipVerify' | 'ConfigHash' | 'Authentication'
  >,
  autoUpdate?: AutoUpdateModel
): GitFormModel {
  if (!response) {
    return getDefaultModel(autoUpdate);
  }

  const { ReferenceName, ConfigFilePath } = response;

  return {
    ComposeFilePathInRepository: ConfigFilePath,
    RepositoryReferenceName: ReferenceName,
    AutoUpdate: autoUpdate,
    SourceId: sourceId,
  };
}
