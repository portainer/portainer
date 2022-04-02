import axios, { parseAxiosError } from '../axios';

interface StatusResponse {
  Failed: boolean;
  TimestampUTC: string;
}

export async function getBackupStatus() {
  try {
    const { data } = await axios.get<StatusResponse>(buildUrl('s3', 'status'));
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve backup status');
  }
}

function buildUrl(resource?: string, action?: string) {
  let url = '/backup';

  if (resource) {
    url += `/${resource}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
