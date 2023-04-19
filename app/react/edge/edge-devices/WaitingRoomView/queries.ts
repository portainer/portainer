import { useMutation, useQueryClient } from 'react-query';

import { EdgeTypes, EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { useIntegratedLicenseInfo } from '@/react/portainer/licenses/use-license.service';
import { LicenseType } from '@/react/portainer/licenses/types';
import { useEnvironmentList } from '@/react/portainer/environments/queries';

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
  return (
    !!integratedInfo &&
    integratedInfo.usedNodes > integratedInfo.licenseInfo.nodes &&
    integratedInfo.licenseInfo.type === LicenseType.Essentials
  );
}

export function useWillExceedNodeLimit() {
  const untrusted = useUntrustedCount();
  const integratedInfo = useIntegratedLicenseInfo();
  return (
    !!integratedInfo &&
    integratedInfo.usedNodes + untrusted > integratedInfo.licenseInfo.nodes &&
    integratedInfo.licenseInfo.type === LicenseType.Essentials
  );
}

export function useUntrustedCount() {
  const query = useEnvironmentList({
    edgeDeviceUntrusted: true,
    types: EdgeTypes,
  });
  return query.totalCount;
}
