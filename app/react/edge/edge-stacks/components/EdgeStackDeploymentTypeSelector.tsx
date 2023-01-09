import _ from 'lodash';

import { EditorType } from '@/react/edge/edge-stacks/types';
import NomadIcon from '@/assets/ico/vendor/nomad.svg?c';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

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
  hasNomadEndpoint: boolean;
  allowKubeToSelectCompose?: boolean;
}

export function EdgeStackDeploymentTypeSelector({
  value,
  onChange,
  hasDockerEndpoint,
  hasKubeEndpoint,
  hasNomadEndpoint,
  allowKubeToSelectCompose,
}: Props) {
  const deploymentOptions: BoxSelectorOption<number>[] = _.compact([
    {
      ...compose,
      value: EditorType.Compose,
      disabled: () =>
        allowKubeToSelectCompose
          ? hasNomadEndpoint
          : hasNomadEndpoint || hasKubeEndpoint,
      tooltip: () =>
        hasNomadEndpoint || hasKubeEndpoint
          ? 'Cannot use this option with Edge Kubernetes or Edge Nomad environments'
          : '',
    },
    {
      ...kubernetes,
      value: EditorType.Kubernetes,
      disabled: () => hasDockerEndpoint || hasNomadEndpoint,
      tooltip: () =>
        hasDockerEndpoint || hasNomadEndpoint
          ? 'Cannot use this option with Edge Docker or Edge Nomad environments'
          : '',
      iconType: 'logo',
    },
    isBE && {
      id: 'deployment_nomad',
      icon: NomadIcon,
      label: 'Nomad',
      description: 'Nomad HCL format',
      value: EditorType.Nomad,
      disabled: () => hasDockerEndpoint || hasKubeEndpoint,
      tooltip: () =>
        hasDockerEndpoint || hasKubeEndpoint
          ? 'Cannot use this option with Edge Docker or Edge Kubernetes environments'
          : '',
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
