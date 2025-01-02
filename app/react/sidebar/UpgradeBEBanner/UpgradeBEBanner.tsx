import { ArrowUpCircle } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

import { useAnalytics } from '@/react/hooks/useAnalytics';
import { useNodesCount } from '@/react/portainer/system/useNodesCount';
import {
  ContainerPlatform,
  useSystemInfo,
} from '@/react/portainer/system/useSystemInfo';
import { useCurrentUser } from '@/react/hooks/useUser';
import { withEdition } from '@/react/portainer/feature-flags/withEdition';
import { withHideOnExtension } from '@/react/hooks/withHideOnExtension';
import { useUser } from '@/portainer/users/queries/useUser';

import { useSidebarState } from '../useSidebarState';

import { UpgradeDialog } from './UpgradeDialog';

export const UpgradeBEBannerWrapper = withHideOnExtension(
  withEdition(UpgradeBEBanner, 'CE')
);

const enabledPlatforms: Array<ContainerPlatform> = [
  'Docker Standalone',
  'Docker Swarm',
  'Kubernetes',
];

function UpgradeBEBanner() {
  const {
    isPureAdmin,
    user: { Id },
  } = useCurrentUser();

  const { trackEvent } = useAnalytics();
  const { isOpen: isSidebarOpen } = useSidebarState();

  const nodesCountQuery = useNodesCount();
  const systemInfoQuery = useSystemInfo();
  const userQuery = useUser(Id);

  const [isOpen, setIsOpen] = useState(false);

  if (!nodesCountQuery.isSuccess || !systemInfoQuery.data || !userQuery.data) {
    return null;
  }

  const nodesCount = nodesCountQuery.data;
  const systemInfo = systemInfoQuery.data;

  const metadata = {
    upgrade: false,
    nodeCount: nodesCount,
    platform: systemInfo.platform,
    edgeAgents: systemInfo.edgeAgents,
    agents: systemInfo.agents,
  };

  if (
    !enabledPlatforms.includes(systemInfo.platform) &&
    process.env.FORCE_SHOW_UPGRADE_BANNER !== ''
  ) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={clsx(
          'flex w-full items-center justify-center gap-1 py-2 pr-2 hover:underline',
          'border border-solid border-blue-9 bg-[#023959] font-medium text-white th-dark:border-[#343434] th-dark:bg-black',
          'th-highcontrast:border th-highcontrast:border-solid th-highcontrast:border-white th-highcontrast:bg-black th-highcontrast:font-medium th-highcontrast:text-white'
        )}
        onClick={handleClick}
      >
        <ArrowUpCircle
          className={clsx(
            'lucide text-lg',
            'fill-gray-6 stroke-[#023959] th-dark:stroke-black th-highcontrast:stroke-black'
          )}
        />
        {isSidebarOpen && <>Upgrade to Business Edition</>}
      </button>

      {isOpen && <UpgradeDialog onDismiss={() => setIsOpen(false)} />}
    </>
  );

  function handleClick() {
    trackEvent(
      isPureAdmin ? 'portainer-upgrade-admin' : 'portainer-upgrade-non-admin',
      {
        category: 'portainer',
        metadata,
      }
    );
    setIsOpen(true);
  }
}
