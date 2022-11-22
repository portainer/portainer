import { ArrowRight } from 'react-feather';
import { useState } from 'react';

import { useAnalytics } from '@/angulartics.matomo/analytics-services';
import { useNodesCount } from '@/react/portainer/system/useNodesCount';
import { useSystemInfo } from '@/react/portainer/system/useSystemInfo';
import { useUser } from '@/react/hooks/useUser';
import { withEdition } from '@/react/portainer/feature-flags/withEdition';
import { withFeatureFlag } from '@/react/portainer/feature-flags/withFeatureFlag';
import { FeatureFlag } from '@/react/portainer/feature-flags/useRedirectFeatureFlag';
import { withHideOnExtension } from '@/react/hooks/withHideOnExtension';

import { useSidebarState } from '../useSidebarState';

import { UpgradeDialog } from './UpgradeDialog';

export const UpgradeBEBannerWrapper = withHideOnExtension(
  withEdition(withFeatureFlag(UpgradeBEBanner, FeatureFlag.BEUpgrade), 'CE')
);

function UpgradeBEBanner() {
  const { isAdmin } = useUser();
  const { trackEvent } = useAnalytics();
  const { isOpen: isSidebarOpen } = useSidebarState();
  const nodesCountQuery = useNodesCount();
  const systemInfoQuery = useSystemInfo();

  const [isOpen, setIsOpen] = useState(false);

  if (!nodesCountQuery.data || !systemInfoQuery.data) {
    return null;
  }

  const nodesCount = nodesCountQuery.data;
  const systemInfo = systemInfoQuery.data;

  const metadata = {
    upgrade: false,
    nodeCount: nodesCount,
    platform: systemInfo.platform,
    edgeAgents: systemInfo.edgeAgents,
    edgeDevices: systemInfo.edgeDevices,
    agents: systemInfo.agents,
  };

  // if (systemInfo.platform !== 'Docker Standalone') {
  //   return null;
  // }

  return (
    <>
      <button
        type="button"
        className="border-0 bg-warning-5 text-warning-9 w-full min-h-[48px] h-12 font-semibold flex justify-center items-center gap-3"
        onClick={handleClick}
      >
        {isSidebarOpen && <>Upgrade to Business Edition</>}
        <ArrowRight className="text-lg feather" />
      </button>

      {isOpen && <UpgradeDialog onDismiss={() => setIsOpen(false)} />}
    </>
  );

  function handleClick() {
    trackEvent(
      isAdmin ? 'portainer-upgrade-admin' : 'portainer-upgrade-non-admin',
      {
        category: 'portainer',
        metadata,
      }
    );
    setIsOpen(true);
  }
}
