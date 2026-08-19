import { RegistryId } from '@/react/portainer/registries/types/registry';
import { AccessControlFormData } from '@/react/portainer/access-control/types';

import { EnvVarValues } from '@@/form-components/EnvironmentVariablesFieldset';

import { EditorFormValues } from './EditorSection/types';
import { GitFormValues } from './GitSection/types';
import { TemplateFormValues } from './TemplateSection/types';
import { UploadFormValues } from './UploadSection/types';

export type BuildMethod = 'editor' | 'upload' | 'repository' | 'template';

export interface BaseFormValues {
  method: BuildMethod;
  name: string;
  env: EnvVarValues;
  accessControl: AccessControlFormData;
  enableWebhook: boolean;
  registries: Array<RegistryId>;
}

export interface FormValues extends BaseFormValues {
  editor: EditorFormValues;
  upload: UploadFormValues;
  git: GitFormValues;
  template: TemplateFormValues;
}
