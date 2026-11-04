import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import {
  LogForgeInstallPayload,
  LogForgeStatus,
  LogForgeUninstallPayload,
} from './types';

export async function getLogForgeStatus() {
  try {
    const { data } = await axios.get<LogForgeStatus>(buildUrl('status'));
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve LogForge status');
  }
}

export async function installOrRegisterLogForge(
  payload: LogForgeInstallPayload
) {
  try {
    const { data } = await axios.post<LogForgeStatus>(
      buildUrl('install'),
      payload
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to configure LogForge');
  }
}

export async function uninstallOrClearLogForge(
  payload: LogForgeUninstallPayload
) {
  try {
    const { data } = await axios.post<LogForgeStatus>(
      buildUrl('uninstall'),
      payload
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to clear LogForge configuration');
  }
}

export function buildUrl(action: string) {
  return `logforge/${action}`;
}
