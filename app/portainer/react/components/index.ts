import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { TagSelector } from '@/react/components/TagSelector';

export const componentsModule = angular
  .module('portainer.app.react.components', [])
  .component(
    'tagSelector',
    r2a(TagSelector, ['allowCreate', 'onChange', 'value'])
  ).name;
