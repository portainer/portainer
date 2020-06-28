import angular from 'angular';
import { EdgeJobController } from './edgeJobController';

angular.module('portainer.edge').component('edgeJobView', {
  templateUrl: './edgeJob.html',
  controller: EdgeJobController,
});
