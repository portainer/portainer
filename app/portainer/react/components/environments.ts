import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { TagsDatatable } from '@/react/portainer/environments/TagsView/TagsDatatable';

export const environmentsModule = angular
  .module('portainer.app.react.components.environments', [])
  .component('tagsDatatable', r2a(TagsDatatable, ['dataset', 'onRemove'])).name;
