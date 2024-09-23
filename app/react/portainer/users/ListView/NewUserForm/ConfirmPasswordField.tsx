import { Check, XIcon } from 'lucide-react';
import { useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { InputGroup } from '@@/form-components/InputGroup';
import { Icon } from '@@/Icon';

import { FormValues } from './FormValues';

export function ConfirmPasswordField() {
  const [{ name, onBlur, onChange, value }, { error }] =
    useField<FormValues['confirmPassword']>('confirmPassword');
  return (
    <FormControl
      inputId="confirm_password"
      label="Confirm password"
      required
      errors={error}
    >
      <InputGroup>
        <InputGroup.Input
          id="confirm_password"
          name={name}
          data-cy="user-passwordConfirmInput"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required
          type="password"
          autoComplete="one-time-code"
        />
        <InputGroup.Addon>
          {error ? (
            <Icon mode="danger" icon={XIcon} />
          ) : (
            <Icon mode="success" icon={Check} />
          )}
        </InputGroup.Addon>
      </InputGroup>
    </FormControl>
  );
}
