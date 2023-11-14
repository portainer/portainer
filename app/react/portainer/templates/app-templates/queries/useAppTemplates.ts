import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { useRegistries } from '@/react/portainer/registries/queries/useRegistries';
import { DockerHubViewModel } from '@/portainer/models/dockerhub';
import { Registry } from '@/react/portainer/registries/types/registry';

import { AppTemplate } from '../types';
import { TemplateViewModel } from '../view-model';

import { buildUrl } from './build-url';

export function useAppTemplates() {
  const registriesQuery = useRegistries();

  return useQuery(
    'templates',
    () => getTemplatesWithRegistry(registriesQuery.data),
    {
      enabled: !!registriesQuery.data,
    }
  );
}

async function getTemplatesWithRegistry(
  registries: Array<Registry> | undefined
) {
  if (!registries) {
    return [];
  }

  const { templates, version } = await getTemplates();
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

async function getTemplates() {
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
