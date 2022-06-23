import { useQuery } from 'react-query';
import clsx from 'clsx';

import smallLogo from '@/assets/images/logo_small.png';
import { getStatus } from '@/portainer/services/api/status.service';

import { UpdateNotification } from './UpdateNotifications';
import styles from './Footer.module.css';

export function Footer() {
  const statusQuery = useStatus();

  if (!statusQuery.data) {
    return null;
  }

  const { Edition, Version } = statusQuery.data;

  return (
    <div className={styles.root}>
      {process.env.PORTAINER_EDITION === 'CE' && <UpdateNotification />}
      <div>
        <img
          src={smallLogo}
          className={clsx('img-responsive', styles.logo)}
          alt="Portainer"
        />
        <span
          className={styles.version}
          data-cy="portainerSidebar-versionNumber"
        >
          {Version}
        </span>
        {process.env.PORTAINER_EDITION !== 'CE' && (
          <div className={styles.editionVersion}>{Edition}</div>
        )}
      </div>
    </div>
  );
}

function useStatus() {
  return useQuery(['status'], () => getStatus());
}
