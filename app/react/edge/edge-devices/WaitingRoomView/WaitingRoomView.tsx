import { useEnvironmentList } from '@/react/portainer/environments/queries/useEnvironmentList';
import { EdgeTypes } from '@/react/portainer/environments/types';
import { withLimitToBE } from '@/react/hooks/useLimitToBE';

import { InformationPanel } from '@@/InformationPanel';
import { TextTip } from '@@/Tip/TextTip';
import { PageHeader } from '@@/PageHeader';

import { Datatable } from './Datatable';

export default withLimitToBE(WaitingRoomView);

function WaitingRoomView() {
  const { environments, isLoading, totalCount } = useEnvironmentList({
    edgeDeviceUntrusted: true,
    excludeSnapshots: true,
    types: EdgeTypes,
  });

  return (
    <>
      <PageHeader
        title="Waiting Room"
        breadcrumbs={[
          { label: 'Edge Devices', link: 'edge.devices' },
          { label: 'Waiting Room' },
        ]}
      />

      <InformationPanel>
        <TextTip color="blue">
          Only environments generated from the AEEC script will appear here,
          manually added environments and edge devices will bypass the waiting
          room.
        </TextTip>
      </InformationPanel>

      <Datatable
        devices={environments}
        totalCount={totalCount}
        isLoading={isLoading}
      />
    </>
  );
}
