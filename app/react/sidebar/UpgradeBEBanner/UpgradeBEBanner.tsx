import { ArrowUpCircle } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

import { useAnalytics } from '@/angulartics.matomo/analytics-services';
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
];

function UpgradeBEBanner() {
  const {
    isAdmin,
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
    edgeDevices: systemInfo.edgeDevices,
    agents: systemInfo.agents,
  };

  if (!enabledPlatforms.includes(systemInfo.platform)) {
    return null;
  }

  const subtleButton = userQuery.data.ThemeSettings.subtleUpgradeButton;

  return (
    <>
      <button
        type="button"
        className={clsx('flex w-full items-center justify-center gap-2 py-2', {
          'bg-warning-5 text-warning-9 border-0 font-semibold': !subtleButton,
          'bg-[#023959] border-blue-9 th-dark:bg-black th-dark:border-[#343434] border border-solid text-white font-medium hover:underline':
            subtleButton,
        })}
        onClick={handleClick}
      >
        <ArrowUpCircle
          className={clsx('text-lg lucide', {
            'fill-warning-9 stroke-warning-5': !subtleButton,
            'fill-warning-6 stroke-[#023959] th-dark:stroke-black':
              subtleButton,
          })}
        />
        {isSidebarOpen && <>Upgrade to Business Edition</>}
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
