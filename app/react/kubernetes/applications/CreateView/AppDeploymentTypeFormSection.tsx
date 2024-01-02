import { BoxSelector } from '@@/BoxSelector';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

import { getDeploymentOptions } from './deploymentOptions';

interface Props {
  value: number;
  onChange(value: number): void;
  supportGlobalDeployment: boolean;
}

export function AppDeploymentTypeFormSection({
  supportGlobalDeployment,
  value,
  onChange,
}: Props) {
  const options = getDeploymentOptions(supportGlobalDeployment);

  return (
    <FormSection title="Deployment">
      <TextTip color="blue">
        Select how you want to deploy your application inside the cluster.
      </TextTip>
      <BoxSelector
        slim
        options={options}
        value={value}
        onChange={onChange}
        radioName="deploymentType"
      />
    </FormSection>
  );
}
