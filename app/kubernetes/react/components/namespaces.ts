import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { NamespaceAppsDatatable } from '@/react/kubernetes/namespaces/ItemView/NamespaceAppsDatatable';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withCurrentUser } from '@/react-tools/withCurrentUser';

export const namespacesModule = angular
  .module('portainer.kubernetes.react.components.namespaces', [])
  .component(
    'kubernetesNamespaceApplicationsDatatable',
    r2a(withUIRouter(withCurrentUser(NamespaceAppsDatatable)), [
      'dataset',
      'isLoading',
      'onRefresh',
    ])
  ).name;
