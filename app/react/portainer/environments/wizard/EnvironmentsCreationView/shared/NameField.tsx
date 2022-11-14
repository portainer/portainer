import { Field, useField } from 'formik';
import { string } from 'yup';
import { useRef } from 'react';
import _ from 'lodash';

import { getEnvironments } from '@/react/portainer/environments/environment.service';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

interface Props {
  readonly?: boolean;
}

export function NameField({ readonly }: Props) {
  const [, meta] = useField('name');

  const id = 'name-input';

  return (
    <FormControl label="Name" required errors={meta.error} inputId={id}>
      <Field
        id={id}
        name="name"
        as={Input}
        data-cy="endpointCreate-nameInput"
        placeholder="e.g. docker-prod01 / kubernetes-cluster01"
        readOnly={readonly}
      />
    </FormControl>
  );
}

export async function isNameUnique(name = '') {
  if (!name) {
    return true;
  }

  try {
    const result = await getEnvironments({ limit: 1, query: { name } });
    if (result.totalCount > 0) {
      return false;
    }
  } catch (e) {
    // if backend fails to respond, assume name is unique, name validation happens also in the backend
  }
  return true;
}

function cacheTest(
  asyncValidate: (val?: string) => Promise<boolean> | undefined
) {
  let valid = false;
  let value = '';

  return async (newValue = '') => {
    if (newValue !== value) {
      const response = await asyncValidate(newValue);
      value = newValue;
      valid = !!response;
    }
    return valid;
  };
}

export function useNameValidation() {
  const uniquenessTest = useRef(cacheTest(_.debounce(isNameUnique, 300)));

  return string()
    .required('Name is required')
    .test('unique-name', 'Name should be unique', uniquenessTest.current);
}
