import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { IngressesDatatableView } from '@/kubernetes/react/views/networks/ingresses/IngressDatatable';
import { CreateIngressView } from '@/kubernetes/react/views/networks/ingresses/CreateIngressView';

export const viewsModule = angular
  .module('portainer.kubernetes.react.views', [])
  .component('kubernetesIngressesView', r2a(IngressesDatatableView, []))
  .component('kubernetesIngressesCreateView', r2a(CreateIngressView, [])).name;
