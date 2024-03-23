import { Plus } from 'lucide-react';

import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { useSettings } from '../../settings/queries';
import {
  FeatureFlag,
  useFeatureFlag,
} from '../../feature-flags/useFeatureFlag';

export function ImportFdoDeviceButton() {
  const flagEnabledQuery = useFeatureFlag(FeatureFlag.FDO);

  const isFDOEnabledQuery = useSettings(
    (settings) => settings.fdoConfiguration.enabled,
    flagEnabledQuery.data
  );

  if (!isFDOEnabledQuery.data || !flagEnabledQuery.data) {
    return null;
  }

  return (
    <Button
      type="button"
      color="secondary"
      icon={Plus}
      as={Link}
      props={{
        to: 'portainer.endpoints.importDevice',
        'data-cy': 'import-fdo-device-link',
      }}
      className="ml-[5px]"
      data-cy="import-fdo-device-button"
    >
      Import FDO device
    </Button>
  );
}
