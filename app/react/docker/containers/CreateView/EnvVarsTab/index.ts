import { envVarValidation } from '@@/form-components/EnvironmentVariablesFieldset';

import { toRequest } from './toRequest';
import { toViewModel, getDefaultViewModel } from './toViewModel';

export { EnvVarsTab } from './EnvVarsTab';

export const envVarsTabUtils = {
  toRequest,
  toViewModel,
  validation: envVarValidation,
  getDefaultViewModel,
};
