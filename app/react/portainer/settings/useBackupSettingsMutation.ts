import { useMutation } from 'react-query';
import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { DownloadBackupPayload } from '../SettingsView/BackupSettingsView/types';

export function useDownloadBackupMutation() {
  return useMutation(downloadBackup);
}

async function downloadBackup(payload: DownloadBackupPayload) {
  try {
    const response = await axios.post('backup', payload, {
      responseType: 'arraybuffer',
    });

    if (response.status !== 200) {
      const decoder = new TextDecoder('utf-8');
      const str = decoder.decode(response.data);
      return JSON.parse(str);
    }

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
