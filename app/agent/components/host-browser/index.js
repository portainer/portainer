import angular from 'angular';
import { HostBrowserController } from './hostBrowserController';

angular.module('portainer.agent').component('hostBrowser', {
  controller: HostBrowserController,
  templateUrl: './hostBrowser.html',
  bindings: {
    endpointId: '<',
  },
});
