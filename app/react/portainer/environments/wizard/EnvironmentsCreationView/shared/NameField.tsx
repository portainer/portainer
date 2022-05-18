import { Field, useField } from 'formik';

import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Input } from '@/portainer/components/form-components/Input';

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
