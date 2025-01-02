import { uniqBy } from 'lodash';

import { Registry } from '@/react/portainer/registries/types/registry';

import { UpdateRegistryPayload } from '../types';

export function createUpdateRegistriesPayload({
  registries,
  namespaceName,
  newRegistriesValues,
  initialRegistriesValues,
  environmentId,
}: {
  registries: Registry[] | undefined;
  namespaceName: string;
  newRegistriesValues: Registry[];
  initialRegistriesValues: Registry[];
  environmentId: number;
}): UpdateRegistryPayload[] {
  if (!registries) {
    return [];
  }

  // Get all unique registries from both initial and new values
  const uniqueRegistries = uniqBy(
    [...initialRegistriesValues, ...newRegistriesValues],
    'Id'
  );

  const payload = uniqueRegistries.map((registry) => {
    const currentNamespaces =
      registry.RegistryAccesses?.[`${environmentId}`]?.Namespaces || [];

    const existsInNewValues = newRegistriesValues.some(
      (r) => r.Id === registry.Id
    );

    // If registry is in new values, add namespace; if not, remove it
    const updatedNamespaces = existsInNewValues
      ? [...new Set([...currentNamespaces, namespaceName])]
      : currentNamespaces.filter((ns) => ns !== namespaceName);

    return {
      Id: registry.Id,
      Namespaces: updatedNamespaces,
    };
  });

  return payload;
}
