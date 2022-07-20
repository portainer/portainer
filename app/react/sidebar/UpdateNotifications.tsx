import { useQuery } from 'react-query';

import { getVersionStatus } from '@/portainer/services/api/status.service';

import styles from './UpdateNotifications.module.css';

export function UpdateNotification() {
  const query = useUpdateNotification();

  if (!query.data || !query.data.UpdateAvailable) {
    return null;
  }

  const { LatestVersion } = query.data;

  return (
    <div className={styles.updateNotification}>
      <a
        target="_blank"
        href={`https://github.com/portainer/portainer/releases/tag/${LatestVersion}`}
        style={{ color: '#091e5d' }}
        rel="noreferrer"
      >
        <i className="fa-lg fas fa-cloud-download-alt space-right" />A new
        version is available
      </a>
    </div>
  );
}

function useUpdateNotification() {
  return useQuery(['status', 'version'], () => getVersionStatus());
}
