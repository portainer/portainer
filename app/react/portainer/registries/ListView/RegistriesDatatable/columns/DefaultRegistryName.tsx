import clsx from 'clsx';

import { useSettings } from '@/react/portainer/settings/queries';

export function DefaultRegistryName() {
  const settingsQuery = useSettings({
    select: (settings) => settings.DefaultRegistry?.Hide,
  });

  return (
    <span
      className={clsx({
        'cm-strikethrough': settingsQuery.isSuccess && settingsQuery.data,
      })}
    >
      Docker Hub (anonymous)
    </span>
  );
}
