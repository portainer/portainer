import Select from 'react-select';

import { UserViewModel } from '@/portainer/models/user';
import { UserId } from '@/portainer/users/types';

interface Props {
  value: UserId[];
  onChange(value: UserId[]): void;
  users: UserViewModel[];
  dataCy?: string;
  inputId?: string;
  placeholder?: string;
}

export function UsersSelector({
  value,
  onChange,
  users,
  dataCy,
  inputId,
  placeholder,
}: Props) {
  return (
    <Select
      isMulti
      getOptionLabel={(user) => user.Username}
      getOptionValue={(user) => user.Id}
      options={users}
      value={users.filter((user) => value.includes(user.Id))}
      closeMenuOnSelect={false}
      onChange={(selectedUsers) =>
        onChange(selectedUsers.map((user) => user.Id))
      }
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
    />
  );
}
