import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { TagSelector } from '@/react/components/TagSelector';

import { customTemplatesModule } from './custom-templates';

export const componentsModule = angular
  .module('portainer.app.react.components', [customTemplatesModule])
  .component(
    'tagSelector',
    r2a(TagSelector, ['allowCreate', 'onChange', 'value'])
  ).name;
