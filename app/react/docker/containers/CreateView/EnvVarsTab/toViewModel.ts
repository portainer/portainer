import { parseArrayOfStrings } from '@@/form-components/EnvironmentVariablesFieldset/utils';

import { ContainerJSON } from '../../queries/container';

export function getDefaultViewModel() {
  return [];
}

export function toViewModel(container: ContainerJSON) {
  return parseArrayOfStrings(container.Config?.Env);
}
