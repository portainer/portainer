import { Check, XIcon } from 'lucide-react';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [{ name, onBlur, onChange, value }, { error }] =
    useField<FormValues['username']>('username');

  return (
    <FormControl
      inputId="username-field"
      label={t('users.username')}
      required
      errors={error}
      tooltip={
        authMethod === AuthenticationMethod.LDAP
          ? t('users.username_ldap_tooltip')
          : null
      }
    >
      <InputGroup>
        <InputGroup.Input
          id="username-field"
          name={name}
          placeholder={t('users.username_placeholder')}
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
