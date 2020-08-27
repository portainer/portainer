import angular from 'angular';

import { EditEdgeStackViewController } from './editEdgeStackViewController';

angular.module('portainer.edge').component('editEdgeStackView', {
  templateUrl: './editEdgeStackView.html',
  controller: EditEdgeStackViewController,
});
