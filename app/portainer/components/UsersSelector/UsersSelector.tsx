import Select from 'react-select';

import { UserViewModel } from '@/portainer/models/user';
import { UserId } from '@/portainer/users/types';
import "./UsersSelector.css"

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
      // theme={(theme) => ({
      //   ...theme,
      //   borderRadius: 0, 
      //   colors: {
      //     ...theme.colors,
      //     primary25: 'neutral90',
      //     primary: 'black',
      //   }
      // })}
      classNamePrefix="selector"
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
