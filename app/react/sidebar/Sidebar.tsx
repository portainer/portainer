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
import { SidebarProvider, useSidebarState } from './useSidebarState';
import { UpgradeBEBannerWrapper } from './UpgradeBEBanner';

export function Sidebar() {
  return (
    /* in the future (when we remove r2a) this should wrap the whole app - to change root styles */
    <SidebarProvider>
      <InnerSidebar />
    </SidebarProvider>
  );
}

function InnerSidebar() {
  const { isAdmin, user } = useUser();
  const isTeamLeader = useIsTeamLeader(user) as boolean;
  const { isOpen } = useSidebarState();

  const settingsQuery = usePublicSettings();

  if (!settingsQuery.data) {
    return null;
  }

  const { LogoURL } = settingsQuery.data;

  return (
    <div className={clsx(styles.root, 'sidebar flex flex-col')}>
      <UpgradeBEBannerWrapper />
      <nav
        className={clsx(
          styles.nav,
          'flex flex-1 flex-col overflow-y-auto py-5 pl-5',
          { 'pr-5': isOpen }
        )}
        aria-label="Main"
      >
        <Header logo={LogoURL} />
        {/* negative margin + padding -> scrollbar won't hide the content */}
        <div
          className={clsx(
            styles.navListContainer,
            'mt-6 flex-1 overflow-y-auto [color-scheme:light] be:[color-scheme:dark] th-dark:[color-scheme:dark] th-highcontrast:[color-scheme:dark]',
            { 'pr-5 -mr-5': isOpen }
          )}
        >
          <ul className={clsx('space-y-5', { 'w-[32px]': !isOpen })}>
            <SidebarItem
              to="portainer.home"
              icon={Home}
              label="Home"
              data-cy="portainerSidebar-home"
            />
            <EnvironmentSidebar />
            {isAdmin && <EdgeComputeSidebar />}
            <SettingsSidebar isAdmin={isAdmin} isTeamLeader={isTeamLeader} />
          </ul>
        </div>
        <div className="mt-auto pt-8">
          <Footer />
        </div>
      </nav>
    </div>
  );
}
