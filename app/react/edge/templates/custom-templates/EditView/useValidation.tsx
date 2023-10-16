import { mixed, number, object, string } from 'yup';
import { useMemo } from 'react';

import { StackType } from '@/react/common/stacks/types';
import { validation as commonFieldsValidation } from '@/react/portainer/custom-templates/components/CommonFields';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { variablesValidation } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { buildGitValidationSchema } from '@/react/portainer/gitops/GitForm';
import { useGitCredentials } from '@/react/portainer/account/git-credentials/git-credentials.service';
import { useCurrentUser } from '@/react/hooks/useUser';
import { useCustomTemplates } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplates';
import { Platform } from '@/react/portainer/templates/types';

export function useValidation(
  currentTemplateId: CustomTemplate['Id'],
  isGit: boolean
) {
  const { user } = useCurrentUser();
  const gitCredentialsQuery = useGitCredentials(user.Id);
  const customTemplatesQuery = useCustomTemplates();

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
        FileContent: isGit
          ? string().default('')
          : string().required('Template is required.'),

        Git: isGit
          ? buildGitValidationSchema(gitCredentialsQuery.data || [])
          : mixed(),
        Variables: variablesValidation(),
      }).concat(
        commonFieldsValidation({
          templates: customTemplatesQuery.data,
          currentTemplateId,
        })
      ),
    [
      currentTemplateId,
      customTemplatesQuery.data,
      gitCredentialsQuery.data,
      isGit,
    ]
  );
}
