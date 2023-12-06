import { StackType } from '@/react/common/stacks/types';
import { type Values as CommonFieldsValues } from '@/react/portainer/custom-templates/components/CommonFields';
import { DefinitionFieldValues } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { Platform } from '@/react/portainer/templates/types';
import { GitFormModel } from '@/react/portainer/gitops/types';
import { AccessControlFormData } from '@/react/portainer/access-control/types';

import {
  editor,
  upload,
  git,
} from '@@/BoxSelector/common-options/build-methods';

import { EdgeTemplateSettings } from '../types';

export const initialBuildMethods = [editor, upload, git] as const;

export type Method = (typeof initialBuildMethods)[number]['value'];

export interface FormValues extends CommonFieldsValues {
  Platform: Platform;
  Type: StackType;
  Method: Method;
  FileContent: string;
  File: File | undefined;
  Git: GitFormModel;
  Variables: DefinitionFieldValues;
  AccessControl?: AccessControlFormData;
  EdgeSettings?: EdgeTemplateSettings;
}
