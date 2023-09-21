import { useState } from 'react';

import { EnvironmentVariablesPanel } from '@@/form-components/EnvironmentVariablesFieldset';
import { ArrayError } from '@@/form-components/InputList/InputList';

import { Values } from './types';

export function EnvVarsTab({
  values: initialValues,
  onChange,
  errors,
}: {
  values: Values;
  onChange(value: Values): void;
  errors?: ArrayError<Values>;
}) {
  const [values, setControlledValues] = useState(initialValues);

  return (
    <EnvironmentVariablesPanel
      values={values}
      explanation="These values will be applied to the container when deployed"
      onChange={handleChange}
      errors={errors}
    />
  );

  function handleChange(values: Values) {
    setControlledValues(values);
    onChange(values);
  }
}
