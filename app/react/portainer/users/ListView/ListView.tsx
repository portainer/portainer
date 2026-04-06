import { useTranslation } from 'react-i18next';

import { PageHeader } from '@@/PageHeader';

import { NewUserForm } from './NewUserForm/NewUserForm';
import { UsersDatatable } from './UsersDatatable/UsersDatatable';

export function ListView() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t('users.title')} breadcrumbs={t('users.breadcrumbs')} reload />

      <NewUserForm />

      <UsersDatatable />
    </>
  );
}
