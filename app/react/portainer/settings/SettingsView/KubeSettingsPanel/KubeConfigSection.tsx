import { useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { PortainerSelect } from '@@/form-components/PortainerSelect';

const options = [
  {
    label: '1 day',
    value: '24h',
  },
  {
    label: '7 days',
    value: `${24 * 7}h`,
  },
  {
    label: '30 days',
    value: `${24 * 30}h`,
  },
  {
    label: '1 year',
    value: `${24 * 30 * 12}h`,
  },
  {
    label: 'No expiry',
    value: '0',
  },
] as const;

export function KubeConfigSection() {
  const [{ value }, { error }, { setValue }] =
    useField<string>('kubeconfigExpiry');

  return (
    <FormSection title="Kubeconfig">
      <FormControl label="Kubeconfig expiry" errors={error}>
        <PortainerSelect
          value={value}
          options={options}
          onChange={(value) => value && setValue(value)}
        />
      </FormControl>
    </FormSection>
  );
}
