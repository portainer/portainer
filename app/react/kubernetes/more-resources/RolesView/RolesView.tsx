import { UserCheck, Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';

import { PageHeader } from '@@/PageHeader';
import { WidgetTabs, Tab, useCurrentTabIndex } from '@@/Widget/WidgetTabs';

import { RolesDatatable } from './RolesDatatable';
import { RoleBindingsDatatable } from './RoleBindingsDatatable';

export function RolesView() {
  const { t } = useTranslation();
  useUnauthorizedRedirect(
    { authorizations: ['K8sRoleBindingsW', 'K8sRolesW'], adminOnlyCE: true },
    { to: 'kubernetes.dashboard' }
  );

  const tabs: Tab[] = [
    {
      name: 'Roles',
      icon: UserCheck,
      widget: <RolesDatatable />,
      selectedTabParam: 'roles',
    },
    {
      name: 'Role Bindings',
      icon: Link,
      widget: <RoleBindingsDatatable />,
      selectedTabParam: 'roleBindings',
    },
  ];

  const currentTabIndex = useCurrentTabIndex(tabs);

  return (
    <>
      <PageHeader title={t('kubernetes.roles.title')} breadcrumbs={t('kubernetes.roles.breadcrumbs')} reload />
      <>
        <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
        <div className="content">{tabs[currentTabIndex].widget}</div>
      </>
    </>
  );
}
