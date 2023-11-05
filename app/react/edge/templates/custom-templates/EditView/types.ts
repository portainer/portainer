import { StackType } from '@/react/common/stacks/types';
import { DefinitionFieldValues } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { Platform } from '@/react/portainer/templates/types';
import { type Values as CommonFieldsValues } from '@/react/portainer/custom-templates/components/CommonFields';
import { GitFormModel } from '@/react/portainer/gitops/types';
import { EdgeTemplateSettings } from '@/react/portainer/templates/custom-templates/types';

export interface FormValues extends CommonFieldsValues {
  Platform: Platform;
  Type: StackType;
  FileContent: string;
  Git?: GitFormModel;
  Variables: DefinitionFieldValues;
  EdgeSettings: EdgeTemplateSettings;
}
