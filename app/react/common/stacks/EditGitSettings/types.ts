import { GitFormModel } from '@/react/portainer/gitops/types';

import { EnvVarValues } from '@@/form-components/EnvironmentVariablesFieldset';

export interface FormValues {
  kube: { name: string };
  git: GitFormModel;
  env: EnvVarValues;
  prune: boolean;
  redeployNow: boolean;
}
