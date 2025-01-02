import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { BackupS3Model } from '../types';

import { buildUrl } from './backupSettings.service';
import { queryKeys } from './queryKeys';

export function useBackupS3Settings<T = BackupS3Model>({
  select,
  enabled,
  onSuccess,
}: {
  select?: (settings: BackupS3Model) => T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
} = {}) {
  return useQuery(queryKeys.backupS3Settings(), getBackupS3Settings, {
    select,
    enabled,
    ...withError('Unable to retrieve s3 backup settings'),
    onSuccess,
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
