import axios, { parseAxiosError } from '@/portainer/services/axios';

import { AMTConfiguration, AMTInformation, Device, DeviceFeatures} from '../../../models/hostmanagement/open-amt';

const BASE_URL = '/open_amt';

export async function configureAMT(formValues : AMTConfiguration) {
  try {
    await axios.post<AMTInformation>(`${BASE_URL}/configure`, formValues);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to configure AMT');
  }
}

export async function getAMTInfo(endpointId : number) {
  try {
    const { data: amtInformation } = await axios.get<AMTInformation>(`${BASE_URL}/${endpointId}/info`);

    return amtInformation;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve environment information');
  }
}

export async function activateDevice(endpointId : number) {
  try {
    await axios.post(`${BASE_URL}/${endpointId}/activate`);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to activate device');
  }
}

export async function getDevices(endpointId : number) {
  try {
    const { data: devices } = await axios.get<Device[]>(`${BASE_URL}/${endpointId}/devices`);

    return devices;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve device information');
  }
}

export async function executeDeviceAction(endpointId : number, deviceGUID : string, action : string) {
  try {
    const actionPayload = { action };
    await axios.post(`${BASE_URL}/${endpointId}/devices/${deviceGUID}/action`, actionPayload);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to execute device action');
  }
}

export async function enableDeviceFeatures(endpointId : number, deviceGUID : string, features : DeviceFeatures) {
  try {
    const featuresPayload = { features };
    const { data : authorizationResponse } = await axios.post(`${BASE_URL}/${endpointId}/devices/${deviceGUID}/features`, featuresPayload);
    return authorizationResponse;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to enable device features');
  }
}