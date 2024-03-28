import { string } from 'yup';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

export function NameField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormControl label="Name" inputId="name-input" errors={error}>
      <Input
        id="name-input"
        value={value}
        onChange={(e) => {
          const name = e.target.value;
          onChange(name);
        }}
        placeholder="e.g. myContainer"
      />
    </FormControl>
  );
}

export function nameValidation() {
  return string().default('');
}
