import _ from 'lodash';

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
  allowKubeToSelectCompose?: boolean;
}

export function EdgeStackDeploymentTypeSelector({
  value,
  onChange,
  hasDockerEndpoint,
  hasKubeEndpoint,
  allowKubeToSelectCompose,
}: Props) {
  const deploymentOptions: BoxSelectorOption<number>[] = _.compact([
    {
      ...compose,
      value: EditorType.Compose,
      disabled: () => !allowKubeToSelectCompose && hasKubeEndpoint,
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
      iconType: 'logo',
    },
  ]);

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
