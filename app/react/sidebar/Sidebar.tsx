import clsx from 'clsx';
import { Home } from 'lucide-react';

import { useUser } from '@/react/hooks/useUser';
import { useIsTeamLeader } from '@/portainer/users/queries';
import { usePublicSettings } from '@/react/portainer/settings/queries';

import styles from './Sidebar.module.css';
import { EdgeComputeSidebar } from './EdgeComputeSidebar';
import { EnvironmentSidebar } from './EnvironmentSidebar';
import { SettingsSidebar } from './SettingsSidebar';
import { SidebarItem } from './SidebarItem';
import { Footer } from './Footer';
import { Header } from './Header';
import { SidebarProvider } from './useSidebarState';
import { UpgradeBEBannerWrapper } from './UpgradeBEBanner';

export function Sidebar() {
  const { isAdmin, user } = useUser();
  const isTeamLeader = useIsTeamLeader(user) as boolean;

  const settingsQuery = usePublicSettings();

  if (!settingsQuery.data) {
    return null;
  }

  const { EnableEdgeComputeFeatures, LogoURL } = settingsQuery.data;

  return (
    /* in the future (when we remove r2a) this should wrap the whole app - to change root styles */
    <SidebarProvider>
      <div className={clsx(styles.root, 'sidebar flex flex-col')}>
        <UpgradeBEBannerWrapper />
        <nav
          className={clsx(
            styles.nav,
            'flex flex-1 flex-col overflow-y-auto p-5'
          )}
          aria-label="Main"
        >
          <Header logo={LogoURL} />
          {/* negative margin + padding -> scrollbar won't hide the content */}
          <div className="mt-6 -mr-4 flex-1 overflow-y-auto pr-4">
            <ul className="space-y-9">
              <SidebarItem
                to="portainer.home"
                icon={Home}
                label="Home"
                data-cy="portainerSidebar-home"
              />
              <EnvironmentSidebar />
              {isAdmin && EnableEdgeComputeFeatures && <EdgeComputeSidebar />}
              <SettingsSidebar isAdmin={isAdmin} isTeamLeader={isTeamLeader} />
            </ul>
          </div>
          <div className="mt-auto pt-8">
            <Footer />
          </div>
        </nav>
      </div>
    </SidebarProvider>
  );
}
