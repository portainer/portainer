import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { IngressesDatatableView } from '@/kubernetes/react/views/networks/ingresses/IngressDatatable';
import { CreateIngressView } from '@/kubernetes/react/views/networks/ingresses/CreateIngressView';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';

export const viewsModule = angular
  .module('portainer.kubernetes.react.views', [])
  .component(
    'kubernetesIngressesView',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(IngressesDatatableView))),
      []
    )
  )
  .component(
    'kubernetesIngressesCreateView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(CreateIngressView))), [])
  ).name;
