import { useMutation, useQueryClient } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

export enum DeviceAction {
  PowerOn = 'power on',
  PowerOff = 'power off',
  Restart = 'restart',
}

export function useExecuteAMTDeviceActionMutation() {
  const queryClient = useQueryClient();
  return useMutation(executeDeviceAction, {
    onSuccess(_data, { environmentId }) {
      queryClient.invalidateQueries([['amt_devices', environmentId]]);
    },
    ...withError('Unable to execute device action'),
  });
}

async function executeDeviceAction({
  action,
  deviceGUID,
  environmentId,
}: {
  environmentId: EnvironmentId;
  deviceGUID: string;
  action: DeviceAction;
}) {
  try {
    await axios.post(
      `/open_amt/${environmentId}/devices/${deviceGUID}/action`,
      { action }
    );
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to execute device action');
  }
}
