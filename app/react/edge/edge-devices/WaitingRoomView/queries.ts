import { useMutation, useQueryClient } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { useIntegratedLicenseInfo } from '@/react/portainer/licenses/use-license.service';

export function useAssociateDeviceMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    (ids: EnvironmentId[]) =>
      promiseSequence(ids.map((id) => () => associateDevice(id))),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['environments']);
      },
      meta: {
        error: {
          title: 'Failure',
          message: 'Failed to associate devices',
        },
      },
    }
  );
}

async function associateDevice(environmentId: EnvironmentId) {
  try {
    await axios.post(`/endpoints/${environmentId}/edge/trust`);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Failed to associate device');
  }
}

export function useLicenseOverused() {
  const integratedInfo = useIntegratedLicenseInfo();
  if (integratedInfo && integratedInfo.licenseInfo.enforcedAt > 0) {
    return true;
  }
  return false;
}
