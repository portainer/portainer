import { useMutation, useQueryClient } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { BackupS3Model } from '../types';

import { buildUrl } from './backupSettings.service';
import { queryKeys } from './queryKeys';

export function useExportS3BackupMutation() {
  const queryClient = useQueryClient();

  return useMutation(exportS3Backup, {
    onSuccess: () => queryClient.invalidateQueries(queryKeys.exportS3Backup()),
    ...withGlobalError('Unable to export backup to S3'),
  });
}

async function exportS3Backup(payload: BackupS3Model) {
  try {
    const response = await axios.post(buildUrl('s3', 'execute'), payload, {});

    return response.data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to export s3 backup');
  }
}
