import { InputList } from '@@/form-components/InputList';
import { ArrayError } from '@@/form-components/InputList/InputList';

import { Item } from './Item';
import { Values } from './types';

export function LabelsTab({
  values,
  onChange,
  errors,
}: {
  values: Values;
  onChange: (values: Values) => void;
  errors?: ArrayError<Values>;
}) {
  return (
    <InputList
      label="Labels"
      onChange={handleChange}
      errors={errors}
      value={values}
      item={Item}
      itemBuilder={() => ({ name: '', value: '' })}
      data-cy="docker-container-labels"
    />
  );

  function handleChange(values: Values) {
    onChange(values);
  }
}
