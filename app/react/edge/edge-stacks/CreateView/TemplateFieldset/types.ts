import { VariablesFieldValue } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';

export type SelectedTemplateValue =
  | { templateId: number; type: 'custom' }
  | { templateId: number; type: 'app' }
  | { templateId: undefined; type: undefined };

export type Values = {
  variables: VariablesFieldValue;
  envVars: Record<string, string>;
} & SelectedTemplateValue;
