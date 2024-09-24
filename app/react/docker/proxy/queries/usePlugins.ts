import { useQuery } from '@tanstack/react-query';
import {
  Plugin,
  PluginInterfaceType,
  PluginsInfo,
} from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from '../../queries/utils/root';

import { buildDockerProxyUrl } from './buildDockerProxyUrl';
import { useInfo } from './useInfo';

const pluginTypeToVersionMap: { [k in keyof PluginsInfo]: string } = {
  Volume: 'docker.volumedriver/1.0',
  Network: 'docker.networkdriver/1.0',
  Log: 'docker.logdriver/1.0',
};

export async function getPlugins(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<Array<Plugin>>(
      buildDockerProxyUrl(environmentId, 'plugins')
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
  pluginType: keyof PluginsInfo
) {
  const systemPluginsQuery = useInfo(environmentId, {
    select: (info) => info.Plugins,
  });
  const pluginsQuery = usePlugins(environmentId, { enabled: !systemOnly });

  return {
    data: aggregateData(
      systemPluginsQuery.data,
      pluginsQuery.data,
      systemOnly,
      pluginType
    ),
    isLoading: systemPluginsQuery.isLoading || pluginsQuery.isLoading,
  };
}

/**
 * @private Exported only for AngularJS `PluginService` factory `app/docker/services/pluginService.js`
 */
export function aggregateData(
  systemPluginsData: PluginsInfo | undefined,
  pluginsData: Plugin[] | undefined,
  systemOnly: boolean,
  pluginType: keyof PluginsInfo
) {
  if (!systemPluginsData) {
    return null;
  }

  const systemPlugins = systemPluginsData[pluginType] || [];

  if (systemOnly) {
    return systemPlugins;
  }

  const plugins =
    pluginsData
      ?.filter(
        (plugin) =>
          plugin.Enabled &&
          // docker has an error in their types, so we need to cast to unknown first
          // see https://docs.docker.com/engine/api/v1.41/#tag/Plugin/operation/PluginList
          plugin.Config.Interface.Types.includes(
            pluginTypeToVersionMap[pluginType] as unknown as PluginInterfaceType
          )
      )
      .map((plugin) => plugin.Name) || [];

  return [...systemPlugins, ...plugins];
}

export function useLoggingPlugins(
  environmentId: EnvironmentId,
  systemOnly: boolean,
  isPodman?: boolean
) {
  //  systemOnly false + podman false|undefined -> both
  //  systemOnly true + podman false|undefined -> system
  //  systemOnly false + podman true -> system
  //  systemOnly true + podman true -> system
  return useServicePlugins(
    environmentId,
    systemOnly || isPodman === true,
    'Log'
  );
}

export function useVolumePlugins(
  environmentId: EnvironmentId,
  systemOnly: boolean
) {
  return useServicePlugins(environmentId, systemOnly, 'Volume');
}

export function useNetworkPlugins(
  environmentId: EnvironmentId,
  systemOnly: boolean
) {
  return useServicePlugins(environmentId, systemOnly, 'Network');
}
