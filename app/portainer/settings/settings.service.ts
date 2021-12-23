import { PublicSettingsViewModel } from '@/portainer/models/settings';

import axios, { parseAxiosError } from '../services/axios';

export async function publicSettings() {
  try {
    const { data } = await axios.get(buildUrl('public'));
    return new PublicSettingsViewModel(data);
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve application settings'
    );
  }
}

function buildUrl(subResource?: string, action?: string) {
  let url = 'settings';
  if (subResource) {
    url += `/${subResource}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
