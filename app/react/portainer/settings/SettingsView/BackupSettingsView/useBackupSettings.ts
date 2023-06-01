import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { queryKeys } from '../../queries/queryKeys';

import { buildUrl } from './backupSettings.service';
import { BackupS3Model } from './types';

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
