import angular from 'angular';
import { EdgeJobsViewController } from './edgeJobsViewController';

angular.module('portainer.edge').component('edgeJobsView', {
  templateUrl: './edgeJobsView.html',
  controller: EdgeJobsViewController,
});
