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
        SourceId: 0,
        RepositoryReferenceName: '',
        ComposeFilePathInRepository: '',
        AdditionalFiles: [],
        AutoUpdate: undefined,
        SupportRelativePath: false,
        FilesystemPath: '',
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
