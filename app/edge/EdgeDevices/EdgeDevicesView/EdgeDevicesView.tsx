import { useState } from 'react';

import { useSettings } from '@/react/portainer/settings/queries';
import { useGroups } from '@/portainer/environment-groups/queries';

import { PageHeader } from '@@/PageHeader';
import { ViewLoading } from '@@/ViewLoading';

import { EdgeDevicesDatatableContainer } from './EdgeDevicesDatatable/EdgeDevicesDatatableContainer';

export function EdgeDevicesView() {
  const [loadingMessage, setLoadingMessage] = useState('');

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

      {loadingMessage ? (
        <ViewLoading message={loadingMessage} />
      ) : (
        <EdgeDevicesDatatableContainer
          setLoadingMessage={setLoadingMessage}
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
