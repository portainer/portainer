import { FormikErrors } from 'formik';
import { SchemaOf, string } from 'yup';

import { STACK_NAME_VALIDATION_REGEX } from '@/react/constants';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { EdgeStack } from '../types';

export function NameField({
  onChange,
  value,
  errors,
}: {
  onChange(value: string): void;
  value: string;
  errors?: FormikErrors<string>;
}) {
  return (
    <FormControl inputId="name-input" label="Name" errors={errors} required>
      <Input
        id="name-input"
        onChange={(e) => onChange(e.target.value)}
        value={value}
        required
      />
    </FormControl>
  );
}

export function nameValidation(
  stacks: Array<EdgeStack>,
  isComposeStack: boolean | undefined
): SchemaOf<string> {
  let schema = string()
    .required('Name is required')
    .test('unique', 'Name should be unique', (value) =>
      stacks.every((s) => s.Name !== value)
    );

  if (isComposeStack) {
    schema = schema.matches(
      new RegExp(STACK_NAME_VALIDATION_REGEX),
      "This field must consist of lower case alphanumeric characters, '_' or '-' (e.g. 'my-name', or 'abc-123')."
    );
  }

  return schema;
}
