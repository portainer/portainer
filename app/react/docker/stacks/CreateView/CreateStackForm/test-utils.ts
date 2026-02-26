import _ from 'lodash';

import { defaultValues } from '@/react/portainer/access-control/utils';
import { DeepPartial } from '@/types';

import { FormValues } from './types';

export function mockFormValues(overrides: DeepPartial<FormValues>): FormValues {
  return _.merge(
    {
      method: 'editor',
      name: 'test-stack',
      env: [],
      accessControl: defaultValues(false, 1),
      enableWebhook: false,
      registries: [],
      editor: {
        fileContent: '',
      },
      upload: {
        file: null,
      },
      git: {
        RepositoryURL: '',
        RepositoryReferenceName: '',
        ComposeFilePathInRepository: '',
        RepositoryAuthentication: false,
        RepositoryUsername: '',
        RepositoryPassword: '',
        RepositoryGitCredentialID: 0,
        TLSSkipVerify: false,
        AdditionalFiles: [],
        AutoUpdate: undefined,
        RepositoryAuthorizationType: undefined,
        SupportRelativePath: false,
        FilesystemPath: '',
        SaveCredential: false,
        NewCredentialName: '',
      },
      template: {
        selectedId: undefined,
        variables: [],
        fileContent: '',
      },
    },
    overrides
  );
}
