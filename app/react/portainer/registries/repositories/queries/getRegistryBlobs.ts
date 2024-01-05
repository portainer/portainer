import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EnvironmentId } from '../../../environments/types';
import { RegistryId } from '../../types/registry';
import { buildProxyUrl } from '../../queries/build-url';

/**
 * TODO: This file is copy of an old angular service, need to migrate it to use axios
 */

interface Params {
  id: RegistryId;
  repository: string;
  digest: string;
  endpointId?: EnvironmentId;
}

function buildUrl(params: Params) {
  return `${buildProxyUrl(params.id)}/${params.repository}/blobs/${
    params.digest
  }`;
}

export interface ImageConfigs {
  architecture: string;
  config: {
    Env: string[];
    Entrypoint: string[];
    WorkingDir: string;
    Labels: Record<string, string>;
    ArgsEscaped: boolean;
  };
  created: string;
  history: Array<{
    created: string;
    created_by: string;
    empty_layer?: boolean;
    comment?: string;
  }>;
  os: string;
  rootfs: {
    type: string;
    diff_ids: string[];
  };
  docker_version?: string;
  container_config?: unknown;
}

export async function getRegistryBlob(params: Params) {
  try {
    const { data } = await axios.get<ImageConfigs | string>(buildUrl(params), {
      params: { endpointId: params.endpointId },
    });

    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (err) {
    throw parseAxiosError(err);
  }
}
