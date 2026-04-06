import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { usePublicSettings } from '@/react/portainer/settings/queries';

export function DefaultRegistryName() {
  const { t } = useTranslation();
  const settingsQuery = usePublicSettings({
    select: (settings) => settings.DefaultRegistry?.Hide,
  });

  return (
    <span
      className={clsx({
        'cm-strikethrough': settingsQuery.isSuccess && settingsQuery.data,
      })}
    >
      {t('registries.docker_hub_anonymous')}
    </span>
  );
}
