import { QueryKey, useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import { Registry, RegistryTypes } from '../types/registry';
import { usePublicSettings } from '../../settings/queries';

import { queryKeys } from './query-keys';

/** ADMIN-ONLY QUERY. Will get an access denied error for non-admin users. */
export function useRegistries<T = Registry[]>(
  queryOptions: GenericRegistriesQueryOptions<T> = {}
) {
  return useGenericRegistriesQuery(
    queryKeys.base(),
    getRegistries,
    queryOptions
  );
}

export type GenericRegistriesQueryOptions<T> = {
  enabled?: boolean;
  select?: (registries: Registry[]) => T;
  onSuccess?: (data: T) => void;
  /** is used to hide the default registry from the list of registries, regardless of the user's settings. Kubernetes views use this. */
  hideDefault?: boolean;
  /** is used to filter the registries by namespace. Kubernetes views use this. */
  namespace?: string;
  /** showError */
  showError?: boolean;
};

export function useGenericRegistriesQuery<T = Registry[]>(
  queryKey: QueryKey,
  fetcher: () => Promise<Array<Registry>>,
  {
    enabled,
    select,
    onSuccess,
    hideDefault: hideDefaultOverride,
    showError = true,
  }: GenericRegistriesQueryOptions<T> = {}
) {
  const hideDefaultRegistryQuery = usePublicSettings({
    select: (settings) => settings.DefaultRegistry?.Hide,
    // We don't need the hideDefaultRegistry info if we're overriding it to true
    enabled: enabled && !hideDefaultOverride,
  });

  const hideDefault = hideDefaultOverride || !!hideDefaultRegistryQuery.data;

  return useQuery(
    queryKey,
    async () => {
      const registries = await fetcher();

      if (
        hideDefault ||
        registries.some((r) => r.Type === RegistryTypes.DOCKERHUB)
      ) {
        return registries;
      }

      return [
        {
          Name: 'Docker Hub (anonymous)',
          Id: 0,
          Type: RegistryTypes.DOCKERHUB,
        } as Registry,
        ...registries,
      ];
    },
    {
      select,
      ...(showError && withError('Unable to retrieve registries')),
      enabled:
        (hideDefaultOverride || hideDefaultRegistryQuery.isSuccess) && enabled,
      onSuccess,
    }
  );
}

export async function getRegistries() {
  try {
    const { data } = await axios.get<Registry[]>('/registries');
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve registries');
  }
}
