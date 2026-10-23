import { EdgeStack } from '@/react/edge/edge-stacks/types';

import { GitFormModel, RelativePathModel } from '../types';

export function parseRelativePathResponse(stack: EdgeStack): RelativePathModel {
  return {
    SupportRelativePath: stack.SupportRelativePath ?? false,
    FilesystemPath: stack.FilesystemPath ?? '',
    SupportPerDeviceConfigs: stack.SupportPerDeviceConfigs ?? false,
    PerDeviceConfigsMatchType: stack.PerDeviceConfigsMatchType ?? '',
    PerDeviceConfigsGroupMatchType: stack.PerDeviceConfigsGroupMatchType ?? '',
    PerDeviceConfigsPath: stack.PerDeviceConfigsPath ?? '',
  };
}

export const dummyGitForm: GitFormModel = {
  SourceId: 0,
  AdditionalFiles: [],
  RepositoryReferenceName: '',
  ComposeFilePathInRepository: '',
};
