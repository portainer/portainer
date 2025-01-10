import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';
import { AxiosProgressEvent } from 'axios';

/**
 * Raw docker API proxy
 * @param environmentId
 * @param file
 * @param onProgress
 * @returns
 */
export async function uploadImages(
  environmentId: EnvironmentId,
  file: File,
  onProgress?: (progressEvent: AxiosProgressEvent) => void
) {
  try {
    const url = buildDockerProxyUrl(environmentId, 'images', 'load');

    const config = {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: onProgress,
    };

    return await axios.post(url, file, config);
  } catch (e) {
    throw parseAxiosError(e, 'Unable to upload image');
  }
}
