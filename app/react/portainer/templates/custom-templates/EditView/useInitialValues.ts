import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { useCurrentUser } from '@/react/hooks/useUser';
import { toGitFormModel } from '@/react/portainer/gitops/types';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

import { CustomTemplate } from '../types';

import { FormValues } from './types';

export function useInitialValues({
  template,
  templateFile,
  isEdge,
}: {
  template: CustomTemplate;
  templateFile: string | undefined;
  isEdge: boolean;
}): FormValues {
  const { user, isAdmin } = useCurrentUser();

  return {
    Title: template.Title,
    FileContent: templateFile || '',
    Type: template.Type,
    Platform: template.Platform,
    Description: template.Description,
    Note: template.Note,
    Logo: template.Logo,
    Variables: template.Variables,
    Git: template.GitConfig ? toGitFormModel(template.GitConfig) : undefined,
    AccessControl:
      !isEdge && template.ResourceControl
        ? parseAccessControlFormData(
            isAdmin,
            user.Id,
            new ResourceControlViewModel(template.ResourceControl)
          )
        : undefined,
    EdgeSettings: template.EdgeSettings,
  };
}
