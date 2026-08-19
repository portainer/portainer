import { StackType } from '@/react/common/stacks/types';
import { type Values as CommonFieldsValues } from '@/react/portainer/custom-templates/components/CommonFields';
import { DefinitionFieldValues } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { Platform } from '@/react/portainer/templates/types';
import { GitFormModel } from '@/react/portainer/gitops/types';
import { AccessControlFormData } from '@/react/portainer/access-control/types';

import { EdgeTemplateSettings } from '../types';

export interface FormValues extends CommonFieldsValues {
  Platform: Platform;
  Type: StackType;
  FileContent: string;
  Git?: GitFormModel;
  Variables: DefinitionFieldValues;
  AccessControl?: AccessControlFormData;
  EdgeSettings?: EdgeTemplateSettings;
}
