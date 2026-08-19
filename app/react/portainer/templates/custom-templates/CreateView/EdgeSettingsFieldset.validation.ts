import { SchemaOf, boolean, mixed, number, object } from 'yup';

import { staggerConfigValidation } from '@/react/edge/edge-stacks/components/StaggerFieldset';
import { relativePathValidation } from '@/react/portainer/gitops/RelativePathFieldset/validation';
import { EdgeTemplateSettings } from '@/react/portainer/templates/custom-templates/types';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

export function edgeFieldsetValidation(): SchemaOf<EdgeTemplateSettings> {
  if (!isBE) {
    return mixed().default(undefined) as SchemaOf<EdgeTemplateSettings>;
  }

  return object({
    RelativePathSettings: relativePathValidation(),
    PrePullImage: boolean().default(false),
    RetryDeploy: boolean().default(false),
    PrivateRegistryId: number().default(undefined),
    StaggerConfig: staggerConfigValidation(),
  });
}
