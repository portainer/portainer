import { parseArrayOfStrings } from '@@/form-components/EnvironmentVariablesFieldset/utils';

import { ContainerDetailsJSON } from '../../queries/useContainer';

export function getDefaultViewModel() {
  return [];
}

export function toViewModel(container: ContainerDetailsJSON) {
  return parseArrayOfStrings(container.Config?.Env);
}
