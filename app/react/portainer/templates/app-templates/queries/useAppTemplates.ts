import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { useRegistries } from '@/react/portainer/registries/queries/useRegistries';
import { DockerHubViewModel } from '@/portainer/models/dockerhub';
import { Registry } from '@/react/portainer/registries/types/registry';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';

import { AppTemplate } from '../types';
import { TemplateViewModel } from '../view-model';

import { buildUrl } from './build-url';

export type AppTemplatesResponse = {
  version: string;
  templates: Array<AppTemplate>;
};

export function useAppTemplates<T = Array<TemplateViewModel>>({
  environmentId,
  select,
  enabled = true,
}: {
  environmentId?: EnvironmentId;
  select?: (templates: Array<TemplateViewModel>) => T;
  enabled?: boolean;
} = {}) {
  const hasEnvParam = !!environmentId;

  const environmentRegistriesQuery = useEnvironmentRegistries(
    environmentId || 0,
    { enabled: enabled && hasEnvParam }
  );
  const registriesQuery = useRegistries({ enabled: enabled && !hasEnvParam });

  const data = hasEnvParam
    ? environmentRegistriesQuery.data
    : registriesQuery.data;

  return useQuery(['templates'], () => getTemplatesWithRegistry(data), {
    enabled: !!data && enabled,
    select,
  });
}

export function useAppTemplate(
  id: AppTemplate['id'] | undefined,
  { enabled }: { enabled?: boolean } = {}
) {
  return useAppTemplates({
    enabled: !!id && enabled,
    select: (templates) => templates.find((t) => t.Id === id),
  });
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
    const { data } = await axios.get<AppTemplatesResponse>(buildUrl());
    return data;
  } catch (err) {
    throw parseAxiosError(err);
  }
}
