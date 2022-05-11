import { UsersSelector } from '@/portainer/components/UsersSelector';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Link } from '@/portainer/components/Link';
import { User } from '@/portainer/users/types';

interface Props {
  name: string;
  users: User[];
  value: number[];
  onChange(value: number[]): void;
  errors?: string | string[];
}

export function UsersField({ name, users, value, onChange, errors }: Props) {
  return (
    <FormControl
      label="Authorized users"
      tooltip={
        users.length > 0
          ? 'You can select which user(s) will be able to manage this resource.'
          : undefined
      }
      inputId="users-selector"
      errors={errors}
    >
      {users.length > 0 ? (
        <UsersSelector
          name={name}
          users={users}
          onChange={onChange}
          value={value}
          inputId="users-selector"
        />
      ) : (
        <span className="small text-muted">
          You have not yet created any users. Head over to the
          <Link to="portainer.users">Users view</Link> to manage users.
        </span>
      )}
    </FormControl>
  );
}
