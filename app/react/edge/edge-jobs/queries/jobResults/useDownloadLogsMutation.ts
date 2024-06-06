import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withInvalidate } from '@/react-tools/react-query';

import { EdgeJob } from '../../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export function useDownloadLogsMutation(id: EdgeJob['Id']) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (environmentId: EnvironmentId) =>
      downloadLogsMutation(id, environmentId),
    ...withInvalidate(queryClient, [queryKeys.base(id)]),
  });
}

async function downloadLogsMutation(
  id: EdgeJob['Id'],
  environmentId: EnvironmentId
) {
  try {
    const { data } = await axios.get<{ FileContent: string }>(
      buildUrl({ id, action: 'logs', taskId: environmentId })
    );
    const downloadData = new Blob([data.FileContent], {
      type: 'text/plain;charset=utf-8',
    });
    const logFileName = `job_${id}_task_${environmentId}.log`;
    saveAs(downloadData, logFileName);
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to download file');
  }
}
