import { ArrowRight } from 'react-feather';

import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import {
  useFeatureFlag,
  FeatureFlag,
} from '@/react/portainer/feature-flags/useRedirectFeatureFlag';
import { useAnalytics } from '@/angulartics.matomo/analytics-services';

import { useNodesCount } from '../portainer/status/useNodesCount';
import { useSystemInfo } from '../portainer/status/useSystemInfo';

export function UpgradeBEBanner() {
  const { data } = useFeatureFlag(FeatureFlag.BEUpgrade, { enabled: !isBE });

  if (isBE || !data) {
    return null;
  }

  return <Inner />;
}

function Inner() {
  const { trackEvent } = useAnalytics();

  const nodesCountQuery = useNodesCount();
  const systemInfoQuery = useSystemInfo();

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
    <button
      type="button"
      className="border-0 bg-warning-5 text-warning-9 w-full h-12 font-semibold flex justify-center items-center gap-3"
      onClick={handleClick}
    >
      Upgrade to Business Edition
      <ArrowRight className="text-lg feather" />
    </button>
  );

  function handleClick() {
    console.log({ metadata, systemInfo });
    trackEvent('portainer-upgrade-admin', {
      category: 'portainer',
      metadata,
    });
  }
}
