import { Field, useField } from 'formik';
import { string } from 'yup';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { EdgeUpdateSchedule } from '../types';

import { FormValues } from './types';

export function NameField() {
  const [{ name }, { error }] = useField<FormValues['name']>('name');

  return (
    <FormControl label="Name" required inputId="name-input" errors={error}>
      <Field as={Input} name={name} id="name-input" />
    </FormControl>
  );
}

export function nameValidation(
  schedules: EdgeUpdateSchedule[],
  currentId?: EdgeUpdateSchedule['id']
) {
  return string()
    .required('This field is required')
    .test('unique', 'Name must be unique', (value) =>
      schedules.every((s) => s.id === currentId || s.name !== value)
    );
}
