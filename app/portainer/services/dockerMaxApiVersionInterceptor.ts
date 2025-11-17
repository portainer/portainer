import { SystemVersion } from 'docker-types/generated/1.41';
import Axios, { InternalAxiosRequestConfig } from 'axios';
import { setupCache, buildMemoryStorage } from 'axios-cache-interceptor';

import { buildDockerProxyUrl } from '@/react/docker/proxy/queries/buildDockerProxyUrl';

import { MAX_DOCKER_API_VERSION } from './dockerMaxApiVersion';

const envVersionAxios = Axios.create({
  baseURL: 'api',
  maxDockerAPIVersion: MAX_DOCKER_API_VERSION,
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
      const minApiVersion = parseFloat(
        (data as SystemVersion & { MinAPIVersion?: string }).MinAPIVersion ?? '0'
      );
      const { maxDockerAPIVersion } = config;

      const versionOverride = getDockerApiVersionOverride(
        apiVersion,
        minApiVersion,
        maxDockerAPIVersion
      );

      if (versionOverride) {
        config.url = config.url?.replace(
          /docker/,
          `docker/v${versionOverride}`
        );
      }
    }
    return config;
  } catch (err) {
    // if the interceptor errors, return the original config
    return rawConfig;
  }
}

export function getDockerApiVersionOverride(
  apiVersion: number,
  minApiVersion: number,
  maxDockerApiVersion: number
) {
  const parsedApi = Number.isFinite(apiVersion) ? apiVersion : 0;
  const parsedMin = Number.isFinite(minApiVersion) ? minApiVersion : 0;
  const parsedMax = Number.isFinite(maxDockerApiVersion)
    ? maxDockerApiVersion
    : 0;

  if (!parsedApi || !parsedMax) {
    return null;
  }

  let desiredVersion = Math.min(parsedApi, parsedMax);

  if (parsedMin > 0 && desiredVersion < parsedMin) {
    desiredVersion = parsedMin;
  }

  if (desiredVersion === parsedApi) {
    return null;
  }

  return desiredVersion;
}
