import clsx from 'clsx';

import { usePublicSettings } from '@/react/portainer/settings/queries';

export function DefaultRegistryDomain() {
  const settingsQuery = usePublicSettings({
    select: (settings) => settings.DefaultRegistry?.Hide,
  });

  return (
    <span
      className={clsx({
        'cm-strikethrough': settingsQuery.isSuccess && settingsQuery.data,
      })}
    >
      docker.io
    </span>
  );
}
