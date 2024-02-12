import { EdgeStack } from '@/react/edge/edge-stacks/types';

import { GitFormModel, RelativePathModel } from '../types';

export function parseRelativePathResponse(stack: EdgeStack): RelativePathModel {
  return {
    SupportRelativePath: stack.SupportRelativePath,
    FilesystemPath: stack.FilesystemPath,
    SupportPerDeviceConfigs: stack.SupportPerDeviceConfigs,
    PerDeviceConfigsMatchType: stack.PerDeviceConfigsMatchType,
    PerDeviceConfigsGroupMatchType: stack.PerDeviceConfigsGroupMatchType,
    PerDeviceConfigsPath: stack.PerDeviceConfigsPath,
  };
}

export const dummyGitForm: GitFormModel = {
  RepositoryURL: '',
  RepositoryURLValid: false,
  RepositoryAuthentication: false,
  RepositoryUsername: '',
  RepositoryPassword: '',
  AdditionalFiles: [],
  RepositoryReferenceName: '',
  ComposeFilePathInRepository: '',
  NewCredentialName: '',
  SaveCredential: false,
  TLSSkipVerify: false,
};
