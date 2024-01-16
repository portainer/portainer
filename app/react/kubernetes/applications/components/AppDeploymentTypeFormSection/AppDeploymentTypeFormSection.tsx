import { Boxes, Sliders } from 'lucide-react';
import { FormikErrors } from 'formik';

import { BoxSelector, BoxSelectorOption } from '@@/BoxSelector';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { FormError } from '@@/form-components/FormError';

import { DeploymentType } from '../../types';

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
  const options = getOptions(supportGlobalDeployment);

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

function getOptions(
  supportGlobalDeployment: boolean
): ReadonlyArray<BoxSelectorOption<DeploymentType>> {
  return [
    {
      id: 'deployment_replicated',
      label: 'Replicated',
      value: 'Replicated',
      icon: Sliders,
      iconType: 'badge',
      description: 'Run one or multiple instances of this container',
    },
    {
      id: 'deployment_global',
      disabled: () => !supportGlobalDeployment,
      tooltip: () =>
        !supportGlobalDeployment
          ? 'The storage or access policy used for persisted folders cannot be used with this option'
          : '',
      label: 'Global',
      description:
        'Application will be deployed as a DaemonSet with an instance on each node of the cluster',
      value: 'Global',
      icon: Boxes,
      iconType: 'badge',
    },
  ] as const;
}
