import { RawAxiosRequestHeaders } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

export function useExportMutation() {
  const environmentId = useEnvironmentId();
  return useMutation({
    mutationFn: (
      args: Omit<Parameters<typeof exportImage>[0], 'environmentId'>
    ) => exportImage({ ...args, environmentId }),
  });
}

export async function exportImage({
  environmentId,
  nodeName,
  images,
}: {
  environmentId: EnvironmentId;
  nodeName?: string;
  images: Array<{ tags?: Array<string>; id: string }>;
}) {
  const { names } = getImagesNamesForDownload(images);

  const headers: RawAxiosRequestHeaders = {};

  if (nodeName) {
    headers['X-PortainerAgent-Target'] = nodeName;
  }

  try {
    const { headers: responseHeaders, data } = await axios.get(
      buildDockerProxyUrl(environmentId, 'images', 'get'),
      {
        headers,
        responseType: 'blob',
        params: {
          names,
        },
      }
    );

    const contentDispositionHeader = responseHeaders['content-disposition'];
    const filename = contentDispositionHeader
      .replace('attachment; filename=', '')
      .trim();
    saveAs(data, filename);
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to pull image');
  }
}

export function getImagesNamesForDownload(
  images: Array<{ tags?: Array<string>; id: string }>
) {
  const names = images.map((image) =>
    image.tags?.length && image.tags[0] !== '<none>:<none>'
      ? image.tags[0]
      : image.id
  );
  return {
    names,
  };
}
