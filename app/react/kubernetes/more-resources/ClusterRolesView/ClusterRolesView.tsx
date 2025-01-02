import { UserCheck, Link } from 'lucide-react';
import { useCurrentStateAndParams } from '@uirouter/react';

import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';

import { PageHeader } from '@@/PageHeader';
import { Tab, WidgetTabs, findSelectedTabIndex } from '@@/Widget/WidgetTabs';

import { ClusterRolesDatatable } from './ClusterRolesDatatable/ClusterRolesDatatable';
import { ClusterRoleBindingsDatatable } from './ClusterRoleBindingsDatatable/ClusterRoleBindingsDatatable';

export function ClusterRolesView() {
  useUnauthorizedRedirect(
    {
      authorizations: ['K8sClusterRoleBindingsW', 'K8sClusterRolesW'],
      adminOnlyCE: true,
    },
    { to: 'kubernetes.dashboard' }
  );

  const tabs: Tab[] = [
    {
      name: 'Cluster Roles',
      icon: UserCheck,
      widget: <ClusterRolesDatatable />,
      selectedTabParam: 'clusterRoles',
    },
    {
      name: 'Cluster Role Bindings',
      icon: Link,
      widget: <ClusterRoleBindingsDatatable />,
      selectedTabParam: 'clusterRoleBindings',
    },
  ];

  const currentTabIndex = findSelectedTabIndex(
    useCurrentStateAndParams(),
    tabs
  );

  return (
    <>
      <PageHeader
        title="Cluster Role list"
        breadcrumbs="Cluster Roles"
        reload
      />
      <>
        <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
        <div className="content">{tabs[currentTabIndex].widget}</div>
      </>
    </>
  );
}
