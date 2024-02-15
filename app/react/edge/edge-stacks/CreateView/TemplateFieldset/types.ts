import { VariablesFieldValue } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

export type SelectedTemplateValue =
  | { template: CustomTemplate; type: 'custom' }
  | { template: TemplateViewModel; type: 'app' }
  | { template: undefined; type: undefined };

export type Values = {
  file?: string;
  variables: VariablesFieldValue;
  envVars: Record<string, string>;
} & SelectedTemplateValue;
