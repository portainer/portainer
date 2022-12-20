import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  OpenAMTConfiguration,
  AMTInformation,
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

export async function getAMTInfo(environmentId: EnvironmentId) {
  try {
    const { data: amtInformation } = await axios.get<AMTInformation>(
      `${BASE_URL}/${environmentId}/info`
    );

    return amtInformation;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve environment information'
    );
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
