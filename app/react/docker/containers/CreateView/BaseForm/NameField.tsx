import { string } from 'yup';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

export function NameField({
  value,
  error,
  placeholder,
  onChange,
}: {
  value?: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormControl label="Name" inputId="name-input" errors={error}>
      <Input
        placeholder={placeholder}
        id="name-input"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        data-cy="container-name-input"
      />
    </FormControl>
  );
}

export function nameValidation() {
  return string().default('');
}
