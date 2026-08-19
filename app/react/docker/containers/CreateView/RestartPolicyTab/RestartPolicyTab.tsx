import { ButtonSelector } from '@@/form-components/ButtonSelector/ButtonSelector';
import { FormControl } from '@@/form-components/FormControl';

import { RestartPolicy } from './types';

export function RestartPolicyTab({
  values,
  onChange,
}: {
  values: RestartPolicy;
  onChange: (values: RestartPolicy) => void;
}) {
  return (
    <FormControl label="Restart Policy">
      <ButtonSelector
        options={[
          { label: 'Never', value: RestartPolicy.No },
          { label: 'Always', value: RestartPolicy.Always },
          { label: 'On failure', value: RestartPolicy.OnFailure },
          { label: 'Unless stopped', value: RestartPolicy.UnlessStopped },
        ]}
        value={values}
        onChange={onChange}
      />
    </FormControl>
  );
}
