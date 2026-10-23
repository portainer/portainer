import { SystemVersion } from 'docker-types';
import Axios, { InternalAxiosRequestConfig } from 'axios';
import { setupCache, buildMemoryStorage } from 'axios-cache-interceptor';

import { buildDockerProxyUrl } from '@/react/docker/proxy/queries/buildDockerProxyUrl';

import { MAX_DOCKER_API_VERSION } from './dockerMaxApiVersion';

const envVersionAxios = Axios.create({
  baseURL: 'api',
});

// setup a cache for the intermediary request sent by the interceptor
const envVersionCache = buildMemoryStorage();
setupCache(envVersionAxios, {
  storage: envVersionCache,
  ttl: 5 * 60 * 1000,
  methods: ['get'],
});

export async function dockerMaxAPIVersionInterceptor(
  rawConfig: InternalAxiosRequestConfig
) {
  try {
    const config = rawConfig;
    const found = config.url?.match(
      /endpoints\/(?<environmentId>\d+)\/docker\//
    );

    if (found && found.groups) {
      const { environmentId } = found.groups;
      const envId = parseInt(environmentId, 10);

      // if we cannot parse the env ID, don't send a request that will fail,
      // exit the interceptor and let the original request config pass through
      if (Number.isNaN(envId)) {
        return config;
      }

      const { data } = await envVersionAxios.get<SystemVersion>(
        buildDockerProxyUrl(envId, 'version')
      );

      const apiVersion = parseFloat(data.ApiVersion ?? '0');

      if (apiVersion > MAX_DOCKER_API_VERSION) {
        config.url = config.url?.replace(
          /docker/,
          `docker/v${MAX_DOCKER_API_VERSION}`
        );
      }
    }
    return config;
  } catch {
    // if the interceptor errors, return the original config
    return rawConfig;
  }
}
