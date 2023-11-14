import axios, { parseAxiosError } from '@/portainer/services/axios';

import { AppTemplate } from '../types';

import { buildUrl } from './build-url';

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
