import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/portainer/environments/types';
import { publicSettings } from '@/portainer/settings/settings.service';

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

export async function expiryMessage() {
  const settings = await publicSettings();

  const prefix = 'Kubeconfig file will';
  switch (settings.KubeconfigExpiry) {
    case '24h':
      return `${prefix} expire in 1 day.`;
    case '168h':
      return `${prefix} expire in 7 days.`;
    case '720h':
      return `${prefix} expire in 30 days.`;
    case '8640h':
      return `${prefix} expire in 1 year.`;
    case '0':
    default:
      return `${prefix} not expire.`;
  }
}
