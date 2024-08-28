import { FormikErrors } from 'formik';
import { SchemaOf, string } from 'yup';
import { useMemo } from 'react';

import { STACK_NAME_VALIDATION_REGEX } from '@/react/constants';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { useStacks } from '../queries/useStacks';

export function NameField({
  onChange,
  value,
  errors,
  placeholder,
}: {
  onChange(value: string): void;
  value: string;
  errors?: FormikErrors<string>;
  placeholder?: string;
}) {
  return (
    <FormControl inputId="name-input" label="Name" errors={errors} required>
      <Input
        id="name-input"
        onChange={(e) => onChange(e.target.value)}
        value={value}
        placeholder={placeholder}
        required
        data-cy="stack-name-input"
      />
    </FormControl>
  );
}

export function useNameValidation(
  environmentId: EnvironmentId
): SchemaOf<string> {
  const stacksQuery = useStacks();

  return useMemo(
    () =>
      string()
        .required('Name is required')
        .test(
          'unique',
          'Name should be unique',
          (value) =>
            stacksQuery.data?.every(
              (s) => s.EndpointId !== environmentId || s.Name !== value
            ) ?? true
        )
        .matches(
          new RegExp(STACK_NAME_VALIDATION_REGEX),
          "This field must consist of lower case alphanumeric characters, '_' or '-' (e.g. 'my-name', or 'abc-123')."
        ),
    [environmentId, stacksQuery.data]
  );
}
