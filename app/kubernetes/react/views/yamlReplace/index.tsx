import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { Button } from '@@/buttons';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

interface Props {
  featureId: FeatureId;
}
export function YAMLReplace({ featureId }: Props) {
  return (
    <TooltipWithChildren
      className="float-right"
      heading="Apply YAML changes"
      BEFeatureID={featureId}
      message="Applies any changes that you make in the YAML editor by calling the Kubernetes API to patch the relevant resources. Any resource removals or unexpected resource additions that you make in the YAML will be ignored. Note that editing is disabled for resources in namespaces marked as system."
    >
      <div className="float-right">
        <Button
          type="button"
          color="warninglight"
          size="small"
          onClick={() => {}}
          disabled
        >
          Apply changes
        </Button>
      </div>
    </TooltipWithChildren>
  );
}
