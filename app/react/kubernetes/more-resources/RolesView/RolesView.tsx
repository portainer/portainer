import { useCurrentStateAndParams } from '@uirouter/react';
import { UserCheck, Link } from 'lucide-react';

import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';

import { PageHeader } from '@@/PageHeader';
import { WidgetTabs, Tab, findSelectedTabIndex } from '@@/Widget/WidgetTabs';

import { RolesDatatable } from './RolesDatatable';
import { RoleBindingsDatatable } from './RoleBindingsDatatable';

export function RolesView() {
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

  const currentTabIndex = findSelectedTabIndex(
    useCurrentStateAndParams(),
    tabs
  );

  return (
    <>
      <PageHeader title="Role list" breadcrumbs="Roles" reload />
      <>
        <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
        <div className="content">{tabs[currentTabIndex].widget}</div>
      </>
    </>
  );
}
