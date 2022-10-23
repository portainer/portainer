import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

const baseUrl = 'kubernetes';

export async function downloadKubeconfigFile(environmentIds: EnvironmentId[]) {
  try {
    const { headers, data } = await axios.get<Blob>(`${baseUrl}/config`, {
      params: { ids: JSON.stringify(environmentIds) },
      responseType: 'blob',
      headers: {
        Accept: 'text/yaml',
      },
    });
    const contentDispositionHeader = headers['content-disposition'];
    const filename = contentDispositionHeader.replace('attachment;', '').trim();
    saveAs(data, filename);
  } catch (e) {
    throw parseAxiosError(e as Error, '');
  }
}
