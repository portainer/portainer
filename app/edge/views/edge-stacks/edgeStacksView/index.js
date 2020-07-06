import angular from 'angular';

import { EdgeStacksViewController } from './edgeStacksViewController';

angular.module('portainer.edge').component('edgeStacksView', {
  templateUrl: './edgeStacksView.html',
  controller: EdgeStacksViewController,
});
