import { AddButton } from '@@/buttons';

import { useSettings } from '../../settings/queries';
import {
  FeatureFlag,
  useFeatureFlag,
} from '../../feature-flags/useFeatureFlag';

export function ImportFdoDeviceButton() {
  const flagEnabledQuery = useFeatureFlag(FeatureFlag.FDO);

  const isFDOEnabledQuery = useSettings({
    select: (settings) => settings.isFDOEnabled,
    enabled: flagEnabledQuery.data,
  });

  if (!isFDOEnabledQuery.data || !flagEnabledQuery.data) {
    return null;
  }

  return (
    <div className="ml-[5px]">
      <AddButton
        color="secondary"
        to="portainer.endpoints.importDevice"
        data-cy="import-fdo-device-button"
      >
        Import FDO device
      </AddButton>
    </div>
  );
}
