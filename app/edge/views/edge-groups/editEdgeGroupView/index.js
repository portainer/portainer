import angular from 'angular';

import { EditEdgeGroupController } from './editEdgeGroupViewController';

angular.module('portainer.edge').component('editEdgeGroupView', {
  templateUrl: './editEdgeGroupView.html',
  controller: EditEdgeGroupController,
});
