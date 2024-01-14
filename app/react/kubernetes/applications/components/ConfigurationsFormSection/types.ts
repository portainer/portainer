import { ConfigMap, Secret } from 'kubernetes-types/core/v1';

export type ConfigurationFormValues = {
  overriden: boolean;
  overridenKeys: ConfigurationOverrideKey[];
  selectedConfiguration: ConfigMap | Secret;
};

export type ConfigurationOverrideKey = {
  key: string;
  type: ConfigurationOverrideKeyType;
  path?: string;
};

export type ConfigurationType = 'ConfigMap' | 'Secret';

type ConfigurationOverrideKeyType = 'NONE' | 'ENVIRONMENT' | 'FILESYSTEM';
