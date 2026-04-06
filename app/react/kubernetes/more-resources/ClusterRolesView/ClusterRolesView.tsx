import { UserCheck, Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';

import { PageHeader } from '@@/PageHeader';
import { Tab, WidgetTabs, useCurrentTabIndex } from '@@/Widget/WidgetTabs';

import { ClusterRolesDatatable } from './ClusterRolesDatatable/ClusterRolesDatatable';
import { ClusterRoleBindingsDatatable } from './ClusterRoleBindingsDatatable/ClusterRoleBindingsDatatable';

export function ClusterRolesView() {
  const { t } = useTranslation();
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

  const currentTabIndex = useCurrentTabIndex(tabs);

  return (
    <>
      <PageHeader
        title="Cluster Role list"
        breadcrumbs={t('kubernetes.cluster_roles.breadcrumbs')}
        reload
      />
      <>
        <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
        <div className="content">{tabs[currentTabIndex].widget}</div>
      </>
    </>
  );
}
