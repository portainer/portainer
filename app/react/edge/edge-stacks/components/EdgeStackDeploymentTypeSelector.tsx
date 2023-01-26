import { EditorType } from '@/react/edge/edge-stacks/types';

import { BoxSelector } from '@@/BoxSelector';
import { BoxSelectorOption } from '@@/BoxSelector/types';
import {
  compose,
  kubernetes,
} from '@@/BoxSelector/common-options/deployment-methods';

interface Props {
  value: number;
  onChange(value: number): void;
  hasDockerEndpoint: boolean;
  hasKubeEndpoint: boolean;
}

export function EdgeStackDeploymentTypeSelector({
  value,
  onChange,
  hasDockerEndpoint,
  hasKubeEndpoint,
}: Props) {
  const deploymentOptions: BoxSelectorOption<number>[] = [
    {
      ...compose,
      value: EditorType.Compose,
      disabled: () => hasKubeEndpoint,
      tooltip: () =>
        hasKubeEndpoint
          ? 'Cannot use this option with Edge Kubernetes environments'
          : '',
    },
    {
      ...kubernetes,
      value: EditorType.Kubernetes,
      disabled: () => hasDockerEndpoint,
      tooltip: () =>
        hasDockerEndpoint
          ? 'Cannot use this option with Edge Docker environments'
          : '',
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
      />
    </>
  );
}
