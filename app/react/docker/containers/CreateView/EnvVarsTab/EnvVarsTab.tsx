import { EnvironmentVariablesPanel } from '@@/form-components/EnvironmentVariablesFieldset';
import { ArrayError } from '@@/form-components/InputList/InputList';

import { Values } from './types';

export function EnvVarsTab({
  values,
  onChange,
  errors,
}: {
  values: Values;
  onChange(value: Values): void;
  errors?: ArrayError<Values>;
}) {
  return (
    <div className="form-group">
      <EnvironmentVariablesPanel
        values={values}
        explanation="These values will be applied to the container when deployed"
        onChange={handleChange}
        errors={errors}
      />
    </div>
  );

  function handleChange(values: Values) {
    onChange(values);
  }
}
