import { SchemaOf, boolean, mixed, number, object } from 'yup';

import { relativePathValidation } from '@/react/portainer/gitops/RelativePathFieldset/validation';
import { EdgeTemplateSettings } from '@/react/portainer/templates/custom-templates/types';

export function edgeFieldsetValidation(): SchemaOf<EdgeTemplateSettings> {
  return object({
    RelativePathSettings: relativePathValidation(),
    PrePullImage: boolean().default(false),
    RetryDeploy: boolean().default(false),
    PrivateRegistryId: number().default(undefined),
    StaggerConfig: mixed(),
  });
}
