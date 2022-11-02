import angular from 'angular';

import { logsView } from './logs';
import { nomadLogViewer } from './nomad-log-viewer';

export const logsModule = angular
  .module('portainer.app.nomad.logs', [])
  .component('nomadLogViewer', nomadLogViewer)
  .component('nomadLogsView', logsView).name;
