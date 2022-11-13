import { FeatureId } from '@/portainer/feature-flags/enums';

import { Button } from '@@/buttons';
import { BeTeaserTooltip } from '@@/Tip/BeTeaserTooltip';

interface Props {
  featureId: FeatureId;
}
export function YAMLReplace({ featureId }: Props) {
  return (
    <BeTeaserTooltip
      className="float-right"
      heading="Apply YAML changes"
      BEFeatureID={featureId}
      message="Applies any changes that you make in the YAML editor by calling the Kubernetes API to patch the relevant resources. Any unexpected resources that you add to the YAML will be ignored."
    >
      <Button
        type="button"
        color="warninglight"
        size="small"
        onClick={() => {}}
        disabled
      >
        Apply changes
      </Button>
    </BeTeaserTooltip>
  );
}
