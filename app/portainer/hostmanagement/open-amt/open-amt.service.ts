import axios, { parseAxiosError } from 'Portainer/services/axios';

import { EnvironmentId } from '@/portainer/environments/types';

import {
  OpenAMTConfiguration,
  AMTInformation,
  AuthorizationResponse,
  Device,
  DeviceFeatures,
} from './model';

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

export async function activateDevice(environmentId: EnvironmentId) {
  try {
    await axios.post(`${BASE_URL}/${environmentId}/activate`);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to activate device');
  }
}

export async function getDevices(environmentId: EnvironmentId) {
  try {
    const { data: devices } = await axios.get<Device[]>(
      `${BASE_URL}/${environmentId}/devices`
    );

    return devices;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve device information');
  }
}

export async function executeDeviceAction(
  environmentId: EnvironmentId,
  deviceGUID: string,
  action: string
) {
  try {
    const actionPayload = { action };
    await axios.post(
      `${BASE_URL}/${environmentId}/devices/${deviceGUID}/action`,
      actionPayload
    );
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to execute device action');
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
