import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { ContainersDatatableContainer } from '@/react/docker/containers/ListView/ContainersDatatable/ContainersDatatableContainer';
import { ContainerQuickActions } from '@/react/docker/containers/components/ContainerQuickActions';

export const componentsModule = angular
  .module('portainer.docker.react.components', [])
  .component(
    'containersDatatable',
    r2a(ContainersDatatableContainer, [
      'endpoint',
      'isAddActionVisible',
      'dataset',
      'onRefresh',
      'isHostColumnVisible',
      'tableKey',
    ])
  )
  .component(
    'containerQuickActions',
    r2a(ContainerQuickActions, [
      'containerId',
      'nodeName',
      'state',
      'status',
      'taskId',
    ])
  ).name;
