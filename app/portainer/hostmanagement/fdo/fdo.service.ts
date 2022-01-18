import axios, { parseAxiosError } from 'Portainer/services/axios';

import { FDOConfiguration, DeviceConfiguration, Profile } from './model';

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

export async function createProfile(
    profileName: string,
    method: string,
    profileFileContent: string,
) {
  const payload: Record<string, unknown> = {
    Name: profileName,
    ProfileFileContent: profileFileContent,
  };
  try {
    await axios.post(`${BASE_URL}/profiles`, payload,
{
        params: { method },
    });
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to create profile');
  }
}

export async function getProfiles() {
  try {
    const { data: profiles } = await axios.get<Profile[]>(
      `${BASE_URL}/profiles`
    );
    return profiles;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve the profiles');
  }
}
