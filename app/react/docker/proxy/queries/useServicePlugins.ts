import { useQuery } from '@tanstack/react-query';
import {
  Plugin,
  PluginInterfaceType,
  PluginsInfo,
} from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from '../../queries/utils/root';

import { buildUrl } from './build-url';
import { useInfo } from './useInfo';

export async function getPlugins(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<Array<Plugin>>(
      buildUrl(environmentId, 'plugins')
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve plugins');
  }
}

function usePlugins(
  environmentId: EnvironmentId,
  { enabled }: { enabled?: boolean } = {}
) {
  return useQuery(
    queryKeys.plugins(environmentId),
    () => getPlugins(environmentId),
    { enabled }
  );
}

export function useServicePlugins(
  environmentId: EnvironmentId,
  systemOnly: boolean,
  pluginType: keyof PluginsInfo,
  pluginVersion: string
) {
  const systemPluginsQuery = useInfo(environmentId, {
    select: (info) => info.Plugins,
  });
  const pluginsQuery = usePlugins(environmentId, { enabled: !systemOnly });

  return {
    data: aggregateData(),
    isLoading: systemPluginsQuery.isLoading || pluginsQuery.isLoading,
  };

  function aggregateData() {
    if (!systemPluginsQuery.data) {
      return null;
    }

    const systemPlugins = systemPluginsQuery.data[pluginType] || [];

    if (systemOnly) {
      return systemPlugins;
    }

    const plugins =
      pluginsQuery.data
        ?.filter(
          (plugin) =>
            plugin.Enabled &&
            // docker has an error in their types, so we need to cast to unknown first
            // see https://docs.docker.com/engine/api/v1.41/#tag/Plugin/operation/PluginList
            plugin.Config.Interface.Types.includes(
              pluginVersion as unknown as PluginInterfaceType
            )
        )
        .map((plugin) => plugin.Name) || [];

    return [...systemPlugins, ...plugins];
  }
}

export function useLoggingPlugins(
  environmentId: EnvironmentId,
  systemOnly: boolean
) {
  return useServicePlugins(
    environmentId,
    systemOnly,
    'Log',
    'docker.logdriver/1.0'
  );
}

export function useVolumePlugins(
  environmentId: EnvironmentId,
  systemOnly: boolean
) {
  return useServicePlugins(
    environmentId,
    systemOnly,
    'Volume',
    'docker.volumedriver/1.0'
  );
}

export function useNetworkPlugins(
  environmentId: EnvironmentId,
  systemOnly: boolean
) {
  return useServicePlugins(
    environmentId,
    systemOnly,
    'Network',
    'docker.networkdriver/1.0'
  );
}
