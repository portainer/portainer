import { Plus } from 'lucide-react';

import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { useSettings } from '../../settings/queries';

export function ImportFdoDeviceButton() {
  const isFDOEnabledQuery = useSettings(
    (settings) => settings.fdoConfiguration.enabled
  );

  if (!isFDOEnabledQuery.data) {
    return null;
  }

  return (
    <Button
      type="button"
      color="secondary"
      icon={Plus}
      as={Link}
      props={{ to: 'portainer.endpoints.importDevice' }}
    >
      Import FDO device
    </Button>
  );
}
