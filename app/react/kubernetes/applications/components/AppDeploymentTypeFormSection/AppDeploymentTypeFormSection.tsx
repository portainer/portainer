import { FormikErrors } from 'formik';

import { BoxSelector } from '@@/BoxSelector';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { FormError } from '@@/form-components/FormError';

import { DeploymentType } from '../../types';
import { getDeploymentOptions } from '../../CreateView/deploymentOptions';

interface Props {
  values: DeploymentType;
  onChange(values: DeploymentType): void;
  errors: FormikErrors<DeploymentType>;
  supportGlobalDeployment: boolean;
}

export function AppDeploymentTypeFormSection({
  values,
  onChange,
  errors,
  supportGlobalDeployment,
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
        value={values}
        onChange={onChange}
        radioName="deploymentType"
      />
      {!!errors && <FormError>{errors}</FormError>}
    </FormSection>
  );
}
