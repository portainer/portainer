import { useQuery } from 'react-query';
import clsx from 'clsx';

import { getVersionStatus } from '@/portainer/services/api/status.service';
import { useUIState } from '@/portainer/hooks/useUIState';

import { Icon } from '@@/Icon';

import styles from './UpdateNotifications.module.css';

export function UpdateNotification() {
  const uiStateStore = useUIState();
  const query = useUpdateNotification();

  if (!query.data || !query.data.UpdateAvailable) {
    return null;
  }

  const { LatestVersion } = query.data;

  if (
    !!uiStateStore.dismissedUpdateVersion &&
    LatestVersion?.length > 0 &&
    uiStateStore.dismissedUpdateVersion === LatestVersion
  ) {
    return null;
  }

  return (
    <div
      className={clsx(
        styles.root,
        'rounded border py-2',
        'bg-blue-11 th-dark:bg-gray-warm-11',
        'border-blue-9 th-dark:border-gray-warm-9'
      )}
    >
      <div className={clsx(styles.dismissTitle, 'vertical-center')}>
        <Icon icon="download-cloud" mode="primary" feather size="md" />
        <span className="space-left">
          New version available {LatestVersion}
        </span>
      </div>

      <div className={clsx(styles.actions)}>
        <button
          type="button"
          className={clsx(styles.dismissBtn, 'space-right')}
          onClick={() => onDismiss(LatestVersion)}
        >
          Dismiss
        </button>
        <a
          className="hyperlink space-left"
          target="_blank"
          href={`https://github.com/portainer/portainer/releases/tag/${LatestVersion}`}
          rel="noreferrer"
        >
          See what&apos;s new
        </a>
      </div>
    </div>
  );

  function onDismiss(version: string) {
    uiStateStore.dismissUpdateVersion(version);
  }
}

function useUpdateNotification() {
  return useQuery(['status', 'version'], () => getVersionStatus());
}
