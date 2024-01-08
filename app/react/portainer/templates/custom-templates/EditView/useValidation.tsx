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

import { CustomTemplate } from '../types';
import { TemplateViewType } from '../useViewType';

export function useValidation({
  isGit,
  templateId,
  viewType,
}: {
  isGit: boolean;
  templateId: CustomTemplate['Id'];
  viewType: TemplateViewType;
}) {
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
        FileContent: string().required('Template is required.'),

        Git: isGit
          ? buildGitValidationSchema(gitCredentialsQuery.data || [])
          : mixed(),
        Variables: variablesValidation(),
        EdgeSettings: viewType === 'edge' ? edgeFieldsetValidation() : mixed(),
      }).concat(
        commonFieldsValidation({
          templates: customTemplatesQuery.data,
          currentTemplateId: templateId,
          viewType,
        })
      ),
    [
      customTemplatesQuery.data,
      gitCredentialsQuery.data,
      isGit,
      templateId,
      viewType,
    ]
  );
}
