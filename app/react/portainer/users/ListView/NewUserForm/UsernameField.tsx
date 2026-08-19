import { Check, XIcon } from 'lucide-react';
import { useField } from 'formik';

import { AuthenticationMethod } from '@/react/portainer/settings/types';

import { FormControl } from '@@/form-components/FormControl';
import { InputGroup } from '@@/form-components/InputGroup';
import { Icon } from '@@/Icon';

import { FormValues } from './FormValues';

export function UsernameField({
  authMethod,
}: {
  authMethod: AuthenticationMethod;
}) {
  const [{ name, onBlur, onChange, value }, { error }] =
    useField<FormValues['username']>('username');

  return (
    <FormControl
      inputId="username-field"
      label="Username"
      required
      errors={error}
      tooltip={
        authMethod === AuthenticationMethod.LDAP
          ? 'Username must exactly match username defined in external LDAP source.'
          : null
      }
    >
      <InputGroup>
        <InputGroup.Input
          id="username-field"
          name={name}
          placeholder="e.g. jdoe"
          data-cy="user-usernameInput"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required
          autoComplete="create-username"
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
