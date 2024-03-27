import { saveAs } from 'file-saver';
import { useMutation } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { mutationOptions, withError } from '@/react-tools/react-query';

import { EdgeStack } from '../../types';

export function useDownloadLogsMutation() {
  return useMutation(
    downloadLogs,
    mutationOptions(withError('Unable to download logs'))
  );
}

interface DownloadLogs {
  edgeStackId: EdgeStack['Id'];
  environmentId: EnvironmentId;
}

async function downloadLogs({ edgeStackId, environmentId }: DownloadLogs) {
  try {
    const { headers, data } = await axios.get<Blob>(
      `/edge_stacks/${edgeStackId}/logs/${environmentId}/file`,
      {
        responseType: 'blob',
        headers: {
          Accept: 'text/yaml',
        },
      }
    );
    const contentDispositionHeader = headers['content-disposition'];
    const filename = contentDispositionHeader
      .replace('attachment; filename=', '')
      .trim();
    saveAs(data, filename);
  } catch (e) {
    throw parseAxiosError(e as Error, '');
  }
}
