import axios, { parseAxiosError } from 'Portainer/services/axios';

import { FDOConfiguration, DeviceConfiguration, Profiles } from './model';

const BASE_URL = '/fdo';

export async function configureFDO(formValues: FDOConfiguration) {
  try {
    await axios.post(`${BASE_URL}/configure`, formValues);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to configure FDO');
  }
}

export async function configureDevice(
  deviceId: string,
  deviceConfig: DeviceConfiguration
) {
  try {
    await axios.post(`${BASE_URL}/configure/${deviceId}`, deviceConfig);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to configure device');
  }
}

export async function getProfiles() {
  try {
    const { data: profiles } = await axios.get<Profiles>(
      `${BASE_URL}/profiles`
    );
    return profiles;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve the profiles');
  }
}
