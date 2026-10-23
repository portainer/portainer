import { useCurrentUser } from '@/react/hooks/useUser';

import { PageHeader } from '@@/PageHeader';

import { NewUserForm } from './NewUserForm/NewUserForm';
import { UsersDatatable } from './UsersDatatable/UsersDatatable';

export function ListView() {
  const { isPureAdmin } = useCurrentUser();

  return (
    <>
      <PageHeader title="Users" breadcrumbs="User management" reload />

      {isPureAdmin && <NewUserForm />}

      <UsersDatatable />
    </>
  );
}
