import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { NamespacesSelector } from '@/react/kubernetes/cluster/RegistryAccessView/NamespacesSelector';

export const componentsModule = angular
  .module('portainer.kubernetes.react.components', [])
  .component(
    'namespacesSelector',
    r2a(NamespacesSelector, [
      'dataCy',
      'inputId',
      'name',
      'namespaces',
      'onChange',
      'placeholder',
      'value',
    ])
  ).name;
