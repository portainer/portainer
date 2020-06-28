import angular from 'angular';

import { EdgeGroupsController } from './edgeGroupsViewController';

angular.module('portainer.edge').component('edgeGroupsView', {
  templateUrl: './edgeGroupsView.html',
  controller: EdgeGroupsController,
});
