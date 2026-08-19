import { ReactNode } from 'react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { SwitchField } from '@@/form-components/SwitchField';

export function ForceDeploymentSwitch({
  checked,
  onChange,
  tooltip = '',
  label = 'Force redeployment',
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  tooltip?: ReactNode;
  label?: string;
}) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <SwitchField
          name="forceUpdate"
          data-cy="gitops-force-redeployment-switch"
          featureId={FeatureId.FORCE_REDEPLOYMENT}
          checked={checked}
          label={label}
          tooltip={tooltip}
          labelClass="col-sm-3 col-lg-2"
          onChange={onChange}
        />
      </div>
    </div>
  );
}
