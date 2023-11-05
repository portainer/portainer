import { StackType } from '@/react/common/stacks/types';
import { type Values as CommonFieldsValues } from '@/react/portainer/custom-templates/components/CommonFields';
import { DefinitionFieldValues } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { Platform } from '@/react/portainer/templates/types';
import { GitFormModel } from '@/react/portainer/gitops/types';
import { EdgeTemplateSettings } from '@/react/portainer/templates/custom-templates/types';

import {
  editor,
  upload,
  git,
} from '@@/BoxSelector/common-options/build-methods';

export const buildMethods = [editor, upload, git] as const;

export type Method = (typeof buildMethods)[number]['value'];

export interface FormValues extends CommonFieldsValues {
  Platform: Platform;
  Type: StackType;
  Method: Method;
  FileContent: string;
  File: File | undefined;
  Git: GitFormModel;
  Variables: DefinitionFieldValues;
  EdgeSettings: EdgeTemplateSettings;
}
