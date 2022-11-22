import { useIsMutating } from 'react-query';

import { useSettings } from '@/react/portainer/settings/queries';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { activateDeviceMutationKey } from '@/portainer/hostmanagement/open-amt/queries';

import { PageHeader } from '@@/PageHeader';
import { ViewLoading } from '@@/ViewLoading';

import { EdgeDevicesDatatable } from './EdgeDevicesDatatable/EdgeDevicesDatatable';

export function ListView() {
  const isActivatingDevice = useIsActivatingDevice();
  const settingsQuery = useSettings();
  const groupsQuery = useGroups();

  if (!settingsQuery.data || !groupsQuery.data) {
    return null;
  }

  const settings = settingsQuery.data;

  return (
    <>
      <PageHeader
        title="Edge Devices"
        reload
        breadcrumbs={[{ label: 'EdgeDevices' }]}
      />

      {isActivatingDevice ? (
        <ViewLoading message="Activating Active Management Technology on selected device..." />
      ) : (
        <EdgeDevicesDatatable
          isFdoEnabled={
            settings.EnableEdgeComputeFeatures &&
            settings.fdoConfiguration.enabled
          }
          showWaitingRoomLink={
            process.env.PORTAINER_EDITION === 'BE' &&
            settings.EnableEdgeComputeFeatures &&
            !settings.TrustOnFirstConnect
          }
          isOpenAmtEnabled={
            settings.EnableEdgeComputeFeatures &&
            settings.openAMTConfiguration.enabled
          }
          mpsServer={settings.openAMTConfiguration.mpsServer}
          groups={groupsQuery.data}
          storageKey="edgeDevices"
        />
      )}
    </>
  );
}

function useIsActivatingDevice() {
  const count = useIsMutating({ mutationKey: activateDeviceMutationKey });
  return count > 0;
}
