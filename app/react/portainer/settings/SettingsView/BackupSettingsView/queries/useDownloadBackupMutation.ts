import { useMutation } from '@tanstack/react-query';
import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';

import { buildUrl } from './backupSettings.service';

export interface DownloadBackupPayload {
  password: string;
}

export function useDownloadBackupMutation() {
  return useMutation(downloadBackup, {
    ...withError('Unable to download backup'),
  });
}

async function downloadBackup(payload: DownloadBackupPayload) {
  try {
    const response = await axios.post(buildUrl(), payload, {
      responseType: 'arraybuffer',
    });

    const file = response.data;
    const filename = response.headers['content-disposition'].replace(
      'attachment; filename=',
      ''
    );
    const blob = new Blob([file], { type: 'application/zip' });
    return saveAs(blob, filename);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to download backup');
  }
}
