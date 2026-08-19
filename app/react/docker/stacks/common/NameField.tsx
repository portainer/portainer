import { FormikErrors } from 'formik';
import { SchemaOf, string } from 'yup';
import { useMemo } from 'react';

import { STACK_NAME_VALIDATION_REGEX } from '@/react/constants';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { useStacks } from '@/react/common/stacks/queries/useStacks';
import { Stack } from '@/react/common/stacks/types';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

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
    <FormControl
      inputId="name-input"
      label="Name"
      errors={errors}
      required
      size="xsmall"
    >
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

/**
 * Stack name validation with uniqueness check
 */
export function nameValidation({
  environmentId,
  stacks = [],
  excludeStackName,
}: {
  environmentId: EnvironmentId;
  stacks?: Array<Stack>;
  excludeStackName?: string;
}): SchemaOf<string> {
  return string()
    .default('')
    .test(
      'unique',
      'Name should be unique',
      (value) =>
        !value ||
        excludeStackName === value ||
        stacks.every((s) => s.EndpointId !== environmentId || s.Name !== value)
    )
    .matches(new RegExp(STACK_NAME_VALIDATION_REGEX), {
      excludeEmptyString: true,
      message:
        "This field must consist of lower case alphanumeric characters, '_' or '-' (e.g. 'my-name', or 'abc-123').",
    });
}

export function useNameValidation(
  environmentId: EnvironmentId
): SchemaOf<string> {
  const stacksQuery = useStacks();

  return useMemo(
    () =>
      nameValidation({ environmentId, stacks: stacksQuery.data }).required(
        'Name is required'
      ),
    [environmentId, stacksQuery.data]
  );
}
