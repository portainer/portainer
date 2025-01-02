import { DeploymentType } from '@/react/edge/edge-stacks/types';

import { BoxSelector } from '@@/BoxSelector';
import { BoxSelectorOption } from '@@/BoxSelector/types';
import {
  compose,
  kubernetes,
} from '@@/BoxSelector/common-options/deployment-methods';

interface Props {
  value: DeploymentType;
  onChange(value: DeploymentType): void;
  hasDockerEndpoint: boolean;
  hasKubeEndpoint: boolean;
  allowKubeToSelectCompose?: boolean;
  error?: string;
}

export function EdgeStackDeploymentTypeSelector({
  value,
  onChange,
  hasDockerEndpoint,
  hasKubeEndpoint,
  allowKubeToSelectCompose,
  error,
}: Props) {
  const deploymentOptions: BoxSelectorOption<DeploymentType>[] = [
    {
      ...compose,
      value: DeploymentType.Compose,
      disabled: () => !allowKubeToSelectCompose && hasKubeEndpoint,
      tooltip: () =>
        hasKubeEndpoint
          ? 'Cannot use this option with Edge Kubernetes environments'
          : '',
    },
    {
      ...kubernetes,
      value: DeploymentType.Kubernetes,
      disabled: () => hasDockerEndpoint,
      tooltip: () =>
        hasDockerEndpoint
          ? 'Cannot use this option with Edge Docker environments'
          : '',
      iconType: 'logo',
    },
  ];

  return (
    <>
      <div className="col-sm-12 form-section-title"> Deployment type</div>
      <BoxSelector
        radioName="deploymentType"
        value={value}
        options={deploymentOptions}
        onChange={onChange}
        error={error}
      />
    </>
  );
}
