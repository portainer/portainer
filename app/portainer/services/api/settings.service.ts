import { AxiosError } from 'axios';

import PortainerError from '@/portainer/error';
import { PublicSettingsViewModel } from '@/portainer/models/settings';

import axios from '../axios';

export async function publicSettings() {
  try {
    const { data } = await axios.get(buildUrl('public'));
    return new PublicSettingsViewModel(data);
  } catch (e) {
    let err = e as Error;

    if ('isAxiosError' in err) {
      const axiosError = err as AxiosError;
      err = new Error(axiosError.response?.data.message);
    }

    throw new PortainerError('Unable to retrieve application settings', err);
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
