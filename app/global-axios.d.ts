import {
  MaxDockerAPIVersionKey,
  MaxDockerAPIVersionType,
} from './portainer/services/dockerMaxApiVersion';

export * from 'axios';

declare module 'axios' {
  interface CreateAxiosDefaults {
    /**
     *  require to define a default max Docker API Version when creating an axios instance
     */
    [MaxDockerAPIVersionKey]: MaxDockerAPIVersionType;
  }

  interface AxiosRequestConfig {
    /**
     * represents the maximum Docker API version supported for the request
     *
     * the default will be used when not specified in the request config
     */
    [MaxDockerAPIVersionKey]?: MaxDockerAPIVersionType;
  }
}
