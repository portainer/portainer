import { convertToArrayOfStrings } from '@@/form-components/EnvironmentVariablesFieldset/utils';
import { EnvVarValues } from '@@/form-components/EnvironmentVariablesFieldset';

import { CreateContainerRequest } from '../types';

export function toRequest(
  oldConfig: CreateContainerRequest,
  values: EnvVarValues
): CreateContainerRequest {
  return {
    ...oldConfig,
    Env: convertToArrayOfStrings(values),
  };
}
