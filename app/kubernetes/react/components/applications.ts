import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { ApplicationsDatatable } from '@/react/kubernetes/applications/ListView/ApplicationsDatatable/ApplicationsDatatable';

export const applicationsModule = angular
  .module('portainer.kubernetes.react.components.applications', [])

  .component(
    'kubernetesApplicationsDatatable',
    r2a(withUIRouter(withCurrentUser(ApplicationsDatatable)), [
      'namespace',
      'namespaces',
      'onNamespaceChange',
      'onRefresh',
      'showSystem',
      'onShowSystemChange',
      'onRemove',
      'hideStacks',
    ])
  ).name;
