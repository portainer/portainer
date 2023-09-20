import { convertToArrayOfStrings } from '@@/form-components/EnvironmentVariablesFieldset/utils';

import { CreateContainerRequest } from '../types';

import { Values } from './types';

export function toRequest(
  oldConfig: CreateContainerRequest,
  values: Values
): CreateContainerRequest {
  return {
    ...oldConfig,
    Env: convertToArrayOfStrings(values),
  };
}
