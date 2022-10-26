import { Field, useField } from 'formik';
import { string } from 'yup';
import { debounce } from 'lodash';

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

export async function isNameUnique(name?: string) {
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

const debouncedIsNameUnique = debounce(isNameUnique, 500);

export function nameValidation() {
  return string()
    .required('Name is required')
    .test(
      'unique-name',
      'Name should be unique',
      (name) => debouncedIsNameUnique(name) || false
    );
}
