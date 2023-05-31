import { useMutation, useQuery, useQueryClient } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';
import { success as notifySuccess } from '@/portainer/services/notifications';

import { queryKeys } from '../../queries/queryKeys';

import { buildUrl } from './backupSettings.service';
import { BackupS3Model, ExportS3BackupPayload } from './types';

export function useBackupS3Settings<T = BackupS3Model>(
  select?: (settings: BackupS3Model) => T,
  enabled = true
) {
  return useQuery(queryKeys.backupS3Settings(), getBackupS3Settings, {
    select,
    enabled,
    staleTime: 50,
    ...withError('Unable to retrieve s3 backup settings'),
  });
}

async function getBackupS3Settings() {
  try {
    const { data } = await axios.get<BackupS3Model>(buildUrl('s3', 'settings'));

    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve s3 backup settings');
  }
}

export function useExportS3BackupMutation() {
  const queryClient = useQueryClient();

  return useMutation(exportS3Backup, {
    onSuccess: () => {
      notifySuccess('Success', 'Exported backup to S3 successfully');
      return queryClient.invalidateQueries(queryKeys.exportS3Backup());
    },
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to export backup to S3',
      },
    },
  });
}

async function exportS3Backup(payload: ExportS3BackupPayload) {
  try {
    const response = await axios.post(buildUrl('s3', 'execute'), payload, {});

    return response.data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to export s3 backup');
  }
}
