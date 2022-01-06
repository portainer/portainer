import { UsersSelector } from '@/portainer/components/UsersSelector';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { UserViewModel } from '@/portainer/models/user';
import { Link } from '@/portainer/components/Link';

interface Props {
  users: UserViewModel[];
  value: number[];
  onChange(value: number[]): void;
}

export function UsersField({ users, value, onChange }: Props) {
  return (
    <FormControl
      label="Authorized users"
      tooltip={
        users.length > 0
          ? 'You can select which user(s) will be able to manage this resource.'
          : undefined
      }
      inputId="users-selector"
    >
      {users.length > 0 ? (
        <UsersSelector
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
