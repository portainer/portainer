import Select from 'react-select';

import { User, UserId } from '@/portainer/users/types';

import styles from './UsersSelector.module.css';

interface Props {
  name?: string;
  value: UserId[];
  onChange(value: UserId[]): void;
  users: User[];
  dataCy?: string;
  inputId?: string;
  placeholder?: string;
}

export function UsersSelector({
  name,
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
      name={name}
      getOptionLabel={(user) => user.Username}
      getOptionValue={(user) => `${user.Id}`}
      options={users}
      className={styles.root}
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
