import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  OpenAMTConfiguration,
  AuthorizationResponse,
  DeviceFeatures,
} from '@/react/edge/edge-devices/open-amt/types';

const BASE_URL = '/open_amt';

export async function configureAMT(formValues: OpenAMTConfiguration) {
  try {
    await axios.post(`${BASE_URL}/configure`, formValues);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to configure AMT');
  }
}

export async function enableDeviceFeatures(
  environmentId: EnvironmentId,
  deviceGUID: string,
  features: DeviceFeatures
) {
  try {
    const featuresPayload = { features };
    const { data: authorizationResponse } =
      await axios.post<AuthorizationResponse>(
        `${BASE_URL}/${environmentId}/devices/${deviceGUID}/features`,
        featuresPayload
      );
    return authorizationResponse;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to enable device features');
  }
}
