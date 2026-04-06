import { useTranslation } from 'react-i18next';

import { User } from '@/portainer/users/types';

import { UsersSelector } from '@@/UsersSelector';
import { FormControl } from '@@/form-components/FormControl';
import { Link } from '@@/Link';

interface Props {
  name: string;
  users: User[];
  value: number[];
  onChange(value: number[]): void;
  errors?: string | string[];
}

export function UsersField({ name, users, value, onChange, errors }: Props) {
  const { t } = useTranslation();
  return (
    <FormControl
      label={t('access_control.users_field_label')}
      tooltip={
        users.length > 0
          ? t('access_control.users_field_tooltip')
          : undefined
      }
      inputId="authorized-users-selector"
      errors={errors}
    >
      {users.length > 0 ? (
        <UsersSelector
          name={name}
          users={users}
          onChange={onChange}
          value={value}
          inputId="authorized-users-selector"
          dataCy="users-selector"
        />
      ) : (
        <span className="small text-muted">
          {t('access_control.no_users_prefix')}{' '}
          <Link to="portainer.users" data-cy="access-control-users-link">{t('access_control.no_users_link')}</Link>{' '}
          {t('access_control.no_users_suffix')}
        </span>
      )}
    </FormControl>
  );
}
