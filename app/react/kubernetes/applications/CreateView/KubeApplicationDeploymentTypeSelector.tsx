import { BoxSelector } from '@@/BoxSelector';

import { getDeploymentOptions } from './deploymentOptions';

interface Props {
  value: number;
  onChange(value: number): void;
  supportGlobalDeployment: boolean;
}

export function KubeApplicationDeploymentTypeSelector({
  supportGlobalDeployment,
  value,
  onChange,
}: Props) {
  const options = getDeploymentOptions(supportGlobalDeployment);

  return (
    <BoxSelector
      slim
      options={options}
      value={value}
      onChange={onChange}
      radioName="deploymentType"
    />
  );
}
