import { ArrowRight } from 'react-feather';
import { useState } from 'react';

import { useAnalytics } from '@/angulartics.matomo/analytics-services';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import {
  useFeatureFlag,
  FeatureFlag,
} from '@/react/portainer/feature-flags/useRedirectFeatureFlag';
import { useNodesCount } from '@/react/portainer/status/useNodesCount';
import { useSystemInfo } from '@/react/portainer/status/useSystemInfo';

import { useSidebarState } from '../useSidebarState';

import { LicenseDialog } from './LicenseDialog';

export function UpgradeBEBanner() {
  const { data } = useFeatureFlag(FeatureFlag.BEUpgrade, { enabled: !isBE });

  if (isBE || !data) {
    return null;
  }

  return <Inner />;
}

function Inner() {
  const { trackEvent } = useAnalytics();
  const { isOpen: isSidebarOpen } = useSidebarState();
  const nodesCountQuery = useNodesCount();
  const systemInfoQuery = useSystemInfo();

  const [isOpen, setIsOpen] = useState(true);

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

      {isOpen && <LicenseDialog onDismiss={() => setIsOpen(false)} />}
    </>
  );

  function handleClick() {
    trackEvent('portainer-upgrade-admin', {
      category: 'portainer',
      metadata,
    });
  }
}
