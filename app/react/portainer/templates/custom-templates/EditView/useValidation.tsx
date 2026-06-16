import { mixed, number, object, string } from 'yup';
import { useMemo } from 'react';

import { StackType } from '@/react/common/stacks/types';
import { validation as commonFieldsValidation } from '@/react/portainer/custom-templates/components/CommonFields';
import { Platform } from '@/react/portainer/templates/types';
import { variablesValidation } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { buildGitValidationSchema } from '@/react/portainer/gitops/GitForm';
import { useCustomTemplates } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplates';
import { edgeFieldsetValidation } from '@/react/portainer/templates/custom-templates/CreateView/EdgeSettingsFieldset.validation';
import { DeployMethod } from '@/react/portainer/gitops/types';

import { CustomTemplate } from '../types';
import { TemplateViewType } from '../useViewType';

export function useValidation({
  isGit,
  templateId,
  viewType,
  deployMethod,
  isSourceSelection,
}: {
  isGit: boolean;
  templateId: CustomTemplate['Id'];
  viewType: TemplateViewType;
  deployMethod: DeployMethod;
  isSourceSelection?: boolean;
}) {
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
        FileContent: string().required('Template is required.'),

        Git: isGit
          ? buildGitValidationSchema(
              false,
              deployMethod,
              false,
              isSourceSelection ?? false
            )
          : mixed(),
        Variables: variablesValidation(),
        EdgeSettings: viewType === 'edge' ? edgeFieldsetValidation() : mixed(),
      }).concat(
        commonFieldsValidation({
          templates: customTemplatesQuery.data,
          currentTemplateId: templateId,
        })
      ),
    [
      customTemplatesQuery.data,
      isGit,
      isSourceSelection,
      templateId,
      viewType,
      deployMethod,
    ]
  );
}
