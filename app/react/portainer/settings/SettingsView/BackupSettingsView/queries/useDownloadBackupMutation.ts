import { useMutation, useQueryClient } from 'react-query';
import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { DownloadBackupPayload } from '../types';
import { queryKeys } from '../../../queries/queryKeys';

import { buildUrl } from './backupSettings.service';

export function useDownloadBackupMutation() {
  const queryClient = useQueryClient();

  return useMutation(downloadBackup, {
    onSuccess: () => queryClient.invalidateQueries(queryKeys.downloadBackup()),
    ...withGlobalError('Unable to download backup'),
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
