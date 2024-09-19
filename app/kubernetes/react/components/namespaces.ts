import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { NamespacesDatatable } from '@/react/kubernetes/namespaces/ListView/NamespacesDatatable';
import { NamespaceAppsDatatable } from '@/react/kubernetes/namespaces/ItemView/NamespaceAppsDatatable';
import { NamespaceAccessDatatable } from '@/react/kubernetes/namespaces/AccessView/AccessDatatable';

export const namespacesModule = angular
  .module('portainer.kubernetes.react.components.namespaces', [])
  .component(
    'kubernetesNamespacesDatatable',
    r2a(withUIRouter(withCurrentUser(NamespacesDatatable)), [])
  )
  .component(
    'kubernetesNamespaceApplicationsDatatable',
    r2a(withUIRouter(withCurrentUser(NamespaceAppsDatatable)), [
      'dataset',
      'isLoading',
      'onRefresh',
    ])
  )
  .component(
    'namespaceAccessDatatable',
    r2a(withUIRouter(withReactQuery(NamespaceAccessDatatable)), [
      'dataset',
      'onRemove',
    ])
  ).name;
