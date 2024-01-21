import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { NamespacesDatatable } from '@/react/kubernetes/namespaces/ListView/NamespacesDatatable';
import { withCurrentUser } from '@/react-tools/withCurrentUser';

export const namespacesModule = angular
  .module('portainer.kubernetes.react.components.namespaces', [])

  .component(
    'kubernetesNamespacesDatatable',
    r2a(withUIRouter(withCurrentUser(NamespacesDatatable)), [
      'dataset',
      'onRemove',
      'onRefresh',
    ])
  ).name;
