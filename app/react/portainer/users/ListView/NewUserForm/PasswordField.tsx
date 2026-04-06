import { useField } from 'formik';
import { useTranslation } from 'react-i18next';

import { Input } from '@@/form-components/Input';
import { FormControl } from '@@/form-components/FormControl';

import { FormValues } from './FormValues';

export function PasswordField() {
  const { t } = useTranslation();
  const [{ name, onBlur, onChange, value }, { error }] =
    useField<FormValues['password']>('password');
  return (
    <FormControl label={t('users.password')} required inputId="psw-input" errors={error}>
      <Input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        id="psw-input"
        data-cy="user-passwordInput"
        required
        autoComplete="one-time-code"
      />
    </FormControl>
  );
}
