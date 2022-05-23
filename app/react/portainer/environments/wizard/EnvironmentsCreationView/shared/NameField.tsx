import { Field, useField } from 'formik';
import { string } from 'yup';
import { debounce } from 'lodash';

import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Input } from '@/portainer/components/form-components/Input';
import { getEndpoints } from '@/portainer/environments/environment.service';

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

async function isNameUnique(name?: string) {
  if (!name) {
    return true;
  }

  try {
    const result = await getEndpoints(0, 1, { name });
    if (result.totalCount > 0) {
      return false;
    }
  } catch (e) {
    // Do nothing
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
