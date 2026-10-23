import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

type Props = {
  value: string;
  onChange: (value: string) => void;
  tooltip?: string;
  error?: string;
};

export function UsernameField({ value, onChange, tooltip, error }: Props) {
  return (
    <FormControl
      inputId="Username"
      label="Username"
      errors={error}
      tooltip={tooltip}
    >
      <Input
        id="Username"
        name="username"
        value={value}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        data-cy="component-gitUsernameInput"
        placeholder="git username"
      />
    </FormControl>
  );
}
