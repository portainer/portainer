import { isFulfilled } from '@/portainer/helpers/promise-utils';
import { getInfo } from '@/react/docker/proxy/queries/useInfo';
import { aggregateData, getPlugins } from '@/react/docker/proxy/queries/usePlugins';

angular.module('portainer.docker').factory('PluginService', PluginServiceFactory);

/* @ngInject */
function PluginServiceFactory(AngularToReact) {
  const { useAxios, injectEnvironmentId } = AngularToReact;

  return {
    volumePlugins: useAxios(injectEnvironmentId(volumePlugins)), // volume create
    networkPlugins: useAxios(injectEnvironmentId(networksPlugins)), // network create
    loggingPlugins: useAxios(injectEnvironmentId(loggingPlugins)), // service create + service edit
  };
}

/**
 * @param {EnvironmentId} environmentId Injected
 * @param {boolean} systemOnly
 */
async function volumePlugins(environmentId, systemOnly) {
  const { systemPluginsData, pluginsData } = await getAllPlugins(environmentId);
  return aggregateData(systemPluginsData, pluginsData, systemOnly, 'Volume');
}

/**
 * @param {EnvironmentId} environmentId Injected
 * @param {boolean} systemOnly
 */
async function networksPlugins(environmentId, systemOnly) {
  const { systemPluginsData, pluginsData } = await getAllPlugins(environmentId);
  return aggregateData(systemPluginsData, pluginsData, systemOnly, 'Network');
}

/**
 * @param {EnvironmentId} environmentId Injected
 * @param {boolean} systemOnly
 */
async function loggingPlugins(environmentId, systemOnly) {
  const { systemPluginsData, pluginsData } = await getAllPlugins(environmentId);
  return aggregateData(systemPluginsData, pluginsData, systemOnly, 'Log');
}

async function getAllPlugins(environmentId) {
  const [system, plugins] = await Promise.allSettled([getInfo(environmentId), getPlugins(environmentId)]);
  const systemPluginsData = isFulfilled(system) ? system.value.Plugins : undefined;
  const pluginsData = isFulfilled(plugins) ? plugins.value : undefined;

  return { systemPluginsData, pluginsData };
}
