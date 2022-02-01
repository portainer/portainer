import { useEffect } from 'react';
import { useQuery } from 'react-query';

import { error as notifyError } from '@/portainer/services/notifications';

import { InformationPanel } from '../components/InformationPanel';
import { TextTip } from '../components/Tip/TextTip';
import { LicenseType } from '../license-management/types';
import { useLicenseInfo } from '../license-management/use-license.service';
import { getNodesCount } from '../services/api/status.service';

export function LicenseNodePanel() {
  const nodesValid = useNodesValid();

  if (nodesValid) {
    return null;
  }

  return (
    <InformationPanel title="License node allowance exceeded">
      <TextTip>
        The number of nodes for your license has been exceeded. Please contact
        your administrator.
      </TextTip>
    </InformationPanel>
  );
}

function useNodesValid() {
  const { isLoading: isLoadingNodes, nodesCount } = useNodesCounts();

  const { isLoading: isLoadingLicense, info } = useLicenseInfo();
  if (
    isLoadingLicense ||
    isLoadingNodes ||
    !info ||
    info.type === LicenseType.Trial
  ) {
    return true;
  }

  console.log(info, nodesCount);

  return nodesCount <= info.nodes;
}

function useNodesCounts() {
  const { isLoading, data, error, isError } = useQuery(
    ['status', 'nodes'],
    () => getNodesCount()
  );
  useEffect(() => {
    if (isError) {
      notifyError('Failure', error as Error, 'Failed to get nodes count');
    }
  }, [error, isError]);

  return { nodesCount: data || 0, isLoading };
}
