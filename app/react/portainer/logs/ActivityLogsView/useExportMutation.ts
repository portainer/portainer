import { useMutation } from '@tanstack/react-query';
import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Query } from './useActivityLogs';

export function useExportMutation() {
  return useMutation({
    mutationFn: exportActivityLogs,
  });
}

async function exportActivityLogs(query: Omit<Query, 'limit'>) {
  try {
    const { data, headers } = await axios.get<Blob>('/useractivity/logs.csv', {
      params: { ...query, limit: 2000 },
      responseType: 'blob',
      headers: {
        'Content-type': 'text/csv',
      },
    });

    const contentDispositionHeader = headers['content-disposition'] || '';
    const filename =
      contentDispositionHeader.replace('attachment; filename=', '').trim() ||
      'logs.csv';
    saveAs(data, filename);
  } catch (err) {
    throw parseAxiosError(err, 'Failed loading user activity logs csv');
  }
}
