import { useMutation, useQueryClient } from 'react-query';
import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { success as notifySuccess } from '@/portainer/services/notifications';

import {
  BackupS3Model,
  DownloadBackupPayload,
} from '../SettingsView/BackupSettingsView/types';
import { buildUrl } from '../SettingsView/BackupSettingsView/backupSettings.service';

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

export function useBackupS3SettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation(updateBackupS3Settings, {
    onSuccess: () => {
      notifySuccess('Success', 'S3 Backup settings successfully saved');
      return queryClient.invalidateQueries(queryKeys.backupS3Settings());
    },
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to save s3 backup settings',
      },
    },
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

async function exportS3Backup(payload: BackupS3Model) {
  try {
    const response = await axios.post(buildUrl('s3', 'execute'), payload, {});

    return response.data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to export s3 backup');
  }
}
