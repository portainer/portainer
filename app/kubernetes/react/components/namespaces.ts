import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { NamespaceAccessDatatable } from '@/react/kubernetes/namespaces/AccessView/AccessDatatable';

export const namespacesModule = angular
  .module('portainer.kubernetes.react.components.namespaces', [])
  .component(
    'namespaceAccessDatatable',
    r2a(withUIRouter(withReactQuery(NamespaceAccessDatatable)), [
      'dataset',
      'onRemove',
    ])
  ).name;
