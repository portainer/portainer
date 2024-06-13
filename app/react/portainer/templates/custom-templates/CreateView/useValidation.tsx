import { mixed, number, object, string } from 'yup';
import { useMemo } from 'react';

import { StackType } from '@/react/common/stacks/types';
import { validation as commonFieldsValidation } from '@/react/portainer/custom-templates/components/CommonFields';
import { Platform } from '@/react/portainer/templates/types';
import { variablesValidation } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { buildGitValidationSchema } from '@/react/portainer/gitops/GitForm';
import { useGitCredentials } from '@/react/portainer/account/git-credentials/git-credentials.service';
import { useCurrentUser } from '@/react/hooks/useUser';
import { useCustomTemplates } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplates';
import { edgeFieldsetValidation } from '@/react/portainer/templates/custom-templates/CreateView/EdgeSettingsFieldset.validation';
import { DeployMethod } from '@/react/portainer/gitops/types';

import { file } from '@@/form-components/yup-file-validation';
import {
  editor,
  git,
  upload,
} from '@@/BoxSelector/common-options/build-methods';

import { initialBuildMethods } from './types';

export function useValidation({
  viewType,
  deployMethod,
}: {
  viewType: 'kube' | 'docker' | 'edge';
  deployMethod: DeployMethod;
}) {
  const { user } = useCurrentUser();
  const gitCredentialsQuery = useGitCredentials(user.Id);
  const customTemplatesQuery = useCustomTemplates({
    params: {
      edge: undefined,
    },
  });

  return useMemo(
    () =>
      object({
        Platform: number()
          .oneOf([Platform.LINUX, Platform.WINDOWS])
          .default(Platform.LINUX),
        Type: number()
          .oneOf([
            StackType.DockerCompose,
            StackType.DockerSwarm,
            StackType.Kubernetes,
          ])
          .default(StackType.DockerCompose),
        Method: string().oneOf(initialBuildMethods.map((m) => m.value)),
        FileContent: string().when('Method', {
          is: editor.value,
          then: (schema) => schema.required('Template is required.'),
        }),
        File: file().when('Method', {
          is: upload.value,
          then: (schema) => schema.required(),
        }),
        Git: mixed().when('Method', {
          is: git.value,
          then: () =>
            buildGitValidationSchema(
              gitCredentialsQuery.data || [],
              false,
              deployMethod
            ),
        }),
        Variables: variablesValidation(),
        EdgeSettings: viewType === 'edge' ? edgeFieldsetValidation() : mixed(),
      }).concat(
        commonFieldsValidation({
          templates: customTemplatesQuery.data,
        })
      ),
    [
      customTemplatesQuery.data,
      gitCredentialsQuery.data,
      viewType,
      deployMethod,
    ]
  );
}
