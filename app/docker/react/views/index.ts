import angular from 'angular';

import { ItemView } from '@/react/docker/networks/ItemView';
import { r2a } from '@/react-tools/react2angular';

export const viewsModule = angular
  .module('portainer.docker.react.views', [])
  .component('networkDetailsView', r2a(ItemView, [])).name;
