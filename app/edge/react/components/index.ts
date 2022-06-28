import angular from 'angular';

import { EdgeGroupsSelector } from '@/react/edge/components/EdgeGroupsSelector';
import { r2a } from '@/react-tools/react2angular';

export const componentsModule = angular
  .module('portainer.edge.react.components', [])
  .component(
    'edgeGroupsSelector',
    r2a(EdgeGroupsSelector, ['items', 'onChange', 'value'])
  ).name;
