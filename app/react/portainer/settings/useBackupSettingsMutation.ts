import { useMutation, useQueryClient } from 'react-query';
import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { success as notifySuccess } from '@/portainer/services/notifications';

import { DownloadBackupPayload } from '../SettingsView/BackupSettingsView/types';

import { queryKeys } from './queryKeys';

export function useDownloadBackupMutation() {
  const queryClient = useQueryClient();

  return useMutation(downloadBackup, {
    onSuccess: () => {
      notifySuccess('Success', 'Downloaded backup successfully');
      return queryClient.invalidateQueries(queryKeys.downloadBackup());
    },
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to download backup',
      },
    },
  });
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
