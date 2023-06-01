import { useMutation, useQueryClient } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { success as notifySuccess } from '@/portainer/services/notifications';
import { withGlobalError } from '@/react-tools/react-query';

import { BackupS3Model } from '../types';
import { queryKeys } from '../../../queries/queryKeys';

import { buildUrl } from './backupSettings.service';


export function useBackupS3SettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation(updateBackupS3Settings, {
    onSuccess: () => {
      notifySuccess('Success', 'S3 Backup settings successfully saved');
      return queryClient.invalidateQueries(queryKeys.backupS3Settings());
    },
    ...withGlobalError('Unable to save s3 backup settings'),
  });
}

async function updateBackupS3Settings(payload: BackupS3Model) {
  try {
    const response = await axios.post(buildUrl('s3', 'settings'), payload, {});

    return response.data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to save s3 backup settings');
  }
}
