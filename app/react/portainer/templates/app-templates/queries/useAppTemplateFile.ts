import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { AppTemplate } from '../types';

import { buildUrl } from './build-url';

export function useAppTemplateFile(
  id?: AppTemplate['id'],
  { enabled }: { enabled?: boolean } = {}
) {
  return useQuery(['templates', id, 'file'], () => fetchFilePreview(id!), {
    enabled: !!id && enabled,
  });
}

export async function fetchFilePreview(id: AppTemplate['id']) {
  try {
    const { data } = await axios.post<{ FileContent: string }>(
      buildUrl({ id, action: 'file' })
    );
    return data.FileContent;
  } catch (err) {
    throw parseAxiosError(err);
  }
}
