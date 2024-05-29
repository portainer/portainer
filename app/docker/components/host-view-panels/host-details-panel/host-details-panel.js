import { HostDetailsPanelController } from './host-details-panel-controller';

angular.module('portainer.docker').component('hostDetailsPanel', {
  templateUrl: './host-details-panel.html',
  controller: HostDetailsPanelController,
  bindings: {
    host: '<',
    isBrowseEnabled: '<',
    browseUrl: '@',
    environmentId: '<',
  },
});
