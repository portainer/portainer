import angular from 'angular';

import { CreateEdgeGroupController } from './createEdgeGroupViewController';

angular.module('portainer.edge').component('createEdgeGroupView', {
  templateUrl: './createEdgeGroupView.html',
  controller: CreateEdgeGroupController,
});
