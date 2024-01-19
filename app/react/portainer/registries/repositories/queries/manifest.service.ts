import { Sha256 } from '@aws-crypto/sha256-js';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { RegistryId } from '../../types/registry';
import { buildProxyUrl } from '../../queries/build-url';

/**
 * TODO: This file is copy of an old angular service, need to migrate it to use axios
 */

interface Params {
  id: RegistryId;
  repository: string;
  tag: string;
  endpointId?: EnvironmentId;
}

function buildUrl({ id, repository, tag }: Params) {
  return `${buildProxyUrl(id)}/${repository}/manifests/${tag}`;
}

export interface ManifestV1 {
  schemaVersion: number;
  name: string;
  tag: string;
  architecture: string;
  fsLayers: {
    blobSum: string;
  }[];
  history: {
    v1Compatibility: string;
  }[];
  signatures: {
    header: {
      jwk: {
        crv: string;
        kid: string;
        kty: string;
        x: string;
        y: string;
      };
      alg: string;
    };
    signature: string;
    protected: string;
  }[];
}

export async function getTagManifestV1(params: Params) {
  try {
    const { data } = await axios.get<ManifestV1>(buildUrl(params), {
      params: { endpointId: params.endpointId },
      headers: {
        Accept: 'application/vnd.docker.distribution.manifest.v1+json',
        'Cache-Control': 'no-cache',
        'If-Modified-Since': 'Mon, 26 Jul 1997 05:00:00 GMT',
      },
    });

    return data;
  } catch (err) {
    throw parseAxiosError(err);
  }
}

export interface ManifestV2 {
  schemaVersion: number;
  mediaType: string;
  config: {
    mediaType: string;
    size: number;
    digest: string;
  };
  layers: {
    mediaType: string;
    size: number;
    digest: string;
  }[];
}

export async function getTagManifestV2(
  params: Params
): Promise<ManifestV2 & { digest: string }> {
  try {
    const { data: resultText, headers } = await axios.get<string>(
      buildUrl(params),
      {
        params: { endpointId: params.endpointId },
        headers: {
          Accept: 'application/vnd.docker.distribution.manifest.v2+json',
          'Cache-Control': 'no-cache',
          'If-Modified-Since': 'Mon, 26 Jul 1997 05:00:00 GMT',
        },
        // To support ECR we need text response
        responseType: 'text',
        // see https://github.com/axios/axios/issues/907#issuecomment-506924322 for text response
        transformResponse: [(data) => data],
      }
    );

    const result = JSON.parse(resultText);
    // ECR does not return the digest header
    result.digest =
      headers['docker-content-digest'] || (await sha256(resultText));

    return result;
  } catch (err) {
    throw parseAxiosError(err);
  }
}

export async function updateManifest(params: Params, data: unknown) {
  try {
    await axios.put(buildUrl(params), data, {
      headers: {
        'Content-Type': 'application/vnd.docker.distribution.manifest.v2+json',
      },
      params: { endpointId: params.endpointId },
    });
  } catch (err) {
    throw parseAxiosError(err);
  }
}

export async function deleteManifest(params: {
  id: RegistryId;
  repository: string;
  tag: string;
  endpointId?: EnvironmentId;
}) {
  try {
    await axios.delete(buildUrl(params), {
      params: { endpointId: params.endpointId },
    });
  } catch (err) {
    throw parseAxiosError(err);
  }
}

function sha256(string: string) {
  const hash = new Sha256();
  hash.update(string);
  return hash.digest();
}
