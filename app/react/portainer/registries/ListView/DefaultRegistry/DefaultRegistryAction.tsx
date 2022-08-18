import { FeatureId } from 'Portainer/feature-flags/enums';

import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';
import { BEFeatureIndicator } from '@@/BEFeatureIndicator';

export function DefaultRegistryAction() {
  return (
    <div className="vertical-center">
      <Button className="btn btn-xs btn-light vertical-center" disabled>
        <Icon icon="eye-off" feather />
        Hide for all users
      </Button>
      <BEFeatureIndicator featureId={FeatureId.HIDE_DEFAULT_REGISTRY} />
    </div>
  );
}
