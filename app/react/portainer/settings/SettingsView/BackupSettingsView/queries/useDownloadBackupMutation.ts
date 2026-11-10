import { useMutation } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { AxiosError } from 'axios';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import {
  defaultErrorParser,
  isDefaultResponse,
} from '@/react/portainer/services/axios/utils/parseAxiosError';
import { withError } from '@/react-tools/react-query';

import { buildUrl } from './backupSettings.service';

export interface DownloadBackupPayload {
  password: string;
}

const DEFAULT_BACKUP_FILENAME = 'portainer-backup.tar.gz';

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
    const filename =
      response.headers['content-disposition']?.replace(
        'attachment; filename=',
        ''
      ) || DEFAULT_BACKUP_FILENAME;
    const blob = new Blob([file], { type: 'application/zip' });
    return saveAs(blob, filename);
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to download backup',
      parseBinaryError
    );
  }
}

/**
 * The request asks for a binary response, so an error body arrives as an
 * ArrayBuffer and has to be decoded before its message can be read. Without
 * this the user only ever sees "Server returned error: <status>".
 */
function parseBinaryError(axiosError: AxiosError<unknown>) {
  const { data } = axiosError.response ?? {};

  if (data instanceof ArrayBuffer) {
    try {
      const body: unknown = JSON.parse(new TextDecoder().decode(data));

      if (isDefaultResponse(body)) {
        return {
          error: new Error(body.message),
          details: body.details || body.message,
        };
      }
    } catch {
      // Not a JSON body, fall through to the default parser.
    }
  }

  return defaultErrorParser(axiosError);
}
