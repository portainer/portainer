import { EnvVarValues } from '@@/form-components/EnvironmentVariablesFieldset';

export interface StackEditorFormValues {
  stackFileContent: string;
  environmentVariables: EnvVarValues;
  rollbackTo?: number;
  prune: boolean;
  enabledWebhook: boolean;
}
