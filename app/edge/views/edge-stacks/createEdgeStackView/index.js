import angular from 'angular';

import CreateEdgeStackViewController from './createEdgeStackViewController';

angular.module('portainer.edge').component('createEdgeStackView', {
  templateUrl: './createEdgeStackView.html',
  controller: CreateEdgeStackViewController,
});
