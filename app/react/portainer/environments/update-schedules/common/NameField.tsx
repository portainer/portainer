import { Field, useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { FormValues } from './types';

export function NameField() {
  const [{ name }, { error }] = useField<FormValues['name']>('name');

  return (
    <FormControl label="Name" required inputId="name-input" errors={error}>
      <Field as={Input} name={name} id="name-input" />
    </FormControl>
  );
}
