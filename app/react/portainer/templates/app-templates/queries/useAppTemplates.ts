import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { useRegistries } from '@/react/portainer/registries/queries/useRegistries';
import { DockerHubViewModel } from '@/portainer/models/dockerhub';
import { Registry } from '@/react/portainer/registries/types/registry';

import { AppTemplate } from '../types';
import { TemplateViewModel } from '../view-model';

import { buildUrl } from './build-url';

export function useAppTemplates<T = Array<TemplateViewModel>>({
  select,
  enabled = true,
}: {
  select?: (templates: Array<TemplateViewModel>) => T;
  enabled?: boolean;
} = {}) {
  const registriesQuery = useRegistries({ enabled });

  return useQuery(
    ['templates'],
    () => getTemplatesWithRegistry(registriesQuery.data),
    {
      enabled: !!registriesQuery.data && enabled,
      select,
    }
  );
}

export function useAppTemplate(
  id: AppTemplate['id'] | undefined,
  { enabled }: { enabled?: boolean } = {}
) {
  const templateListQuery = useAppTemplates({ enabled: !!id && enabled });

  const template = templateListQuery.data?.find((t) => t.Id === id);

  return {
    data: template,
    isLoading: templateListQuery.isInitialLoading,
    error: templateListQuery.error,
  };
}

async function getTemplatesWithRegistry(
  registries: Array<Registry> | undefined
) {
  if (!registries) {
    return [];
  }

  const { templates, version } = await getAppTemplates();
  return templates.map((item) => {
    const template = new TemplateViewModel(item, version);
    const registryURL = item.registry;
    const registry = registryURL
      ? registries.find((reg) => reg.URL === registryURL)
      : new DockerHubViewModel();
    template.RegistryModel.Registry = registry || new DockerHubViewModel();
    return template;
  });
}

export async function getAppTemplates() {
  try {
    const { data } = await axios.get<{
      version: string;
      templates: Array<AppTemplate>;
    }>(buildUrl());
    return data;
  } catch (err) {
    throw parseAxiosError(err);
  }
}
