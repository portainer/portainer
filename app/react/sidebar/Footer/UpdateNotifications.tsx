import clsx from 'clsx';
import { DownloadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useUIState } from '@/react/hooks/useUIState';
import { useSystemVersion } from '@/react/portainer/system/useSystemVersion';

import { Icon } from '@@/Icon';

import styles from './UpdateNotifications.module.css';

export function UpdateNotification() {
  const uiStateStore = useUIState();
  const query = useSystemVersion();
  const { t } = useTranslation();

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
        <Icon icon={DownloadCloud} mode="primary" size="md" />
        <span className="space-left">
          {t('sidebar.update.new_version_available')} {LatestVersion}
        </span>
      </div>

      <div className={clsx(styles.actions)}>
        <button
          type="button"
          className={clsx(styles.dismissBtn, 'space-right')}
          onClick={() => onDismiss(LatestVersion)}
        >
          {t('sidebar.update.dismiss')}
        </button>
        <a
          className="hyperlink space-left"
          target="_blank"
          href={`https://github.com/portainer/portainer/releases/tag/${LatestVersion}`}
          rel="noreferrer"
        >
          {t('sidebar.update.see_whats_new')}
        </a>
      </div>
    </div>
  );

  function onDismiss(version: string) {
    uiStateStore.dismissUpdateVersion(version);
  }
}
