import { useState } from 'react';

import { InputList } from '@@/form-components/InputList';
import { ArrayError } from '@@/form-components/InputList/InputList';

import { Item } from './Item';
import { Values } from './types';

export function LabelsTab({
  values: initialValues,
  onChange,
  errors,
}: {
  values: Values;
  onChange: (values: Values) => void;
  errors?: ArrayError<Values>;
}) {
  const [values, setControlledValues] = useState(initialValues);

  return (
    <InputList
      label="Labels"
      onChange={handleChange}
      errors={errors}
      value={values}
      item={Item}
      itemBuilder={() => ({ name: '', value: '' })}
    />
  );

  function handleChange(values: Values) {
    setControlledValues(values);
    onChange(values);
  }
}
