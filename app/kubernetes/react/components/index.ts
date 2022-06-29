import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { NamespacesSelector } from '@/react/kubernetes/cluster/RegistryAccessView/NamespacesSelector';
import { StorageAccessModeSelector } from '@/react/kubernetes/cluster/ConfigureView/StorageAccessModeSelector';

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
  )
  .component(
    'storageAccessModeSelector',
    r2a(StorageAccessModeSelector, [
      'inputId',
      'onChange',
      'options',
      'value',
      'storageClassName',
    ])
  ).name;
