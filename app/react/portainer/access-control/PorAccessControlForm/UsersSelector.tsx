import { useTranslation } from 'react-i18next';

import { User } from '@/portainer/users/types';

import { Select } from '@@/form-components/ReactSelect';

interface Props {
  value: User[];
  onChange(value: readonly User[]): void;
  options: User[];
  inputId?: string;
}

// to be removed with the angularjs app/portainer/components/accessControlForm
export function PorAccessControlFormUserSelector({
  value,
  onChange,
  options,
  inputId,
}: Props) {
  const { t } = useTranslation();
  return (
    <Select
      isMulti
      getOptionLabel={(option) => option.Username}
      getOptionValue={(option) => String(option.Id)}
      options={options}
      value={value}
      closeMenuOnSelect={false}
      onChange={onChange}
      data-cy="portainer-selectUserAccess"
      id="portainer-selectUserAccess"
      inputId={inputId}
      placeholder={t('access_control_form.users_selector_placeholder')}
    />
  );
}
