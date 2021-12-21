import axios, { parseAxiosError } from '@/portainer/services/axios';

import { FDOConfiguration, DeviceConfiguration } from '../../../models/hostmanagement/fdo';

const BASE_URL = '/fdo';

export async function configureFDO(formValues : FDOConfiguration) {
    try {
        await axios.post(`${BASE_URL}/configure`, formValues);
    } catch (e) {
        throw parseAxiosError(e as Error, 'Unable to configure FDO');
    }
}


export async function configureDevice(deviceId : string, deviceConfig : DeviceConfiguration) {
    try {
        await axios.post(`${BASE_URL}/configure/${deviceId}`, deviceConfig);
    } catch (e) {
        throw parseAxiosError(e as Error, 'Unable to configure device');
    }
}