import angular from 'angular';
import { CreateEdgeJobViewController } from './createEdgeJobViewController';

angular.module('portainer.edge').component('createEdgeJobView', {
  templateUrl: './createEdgeJobView.html',
  controller: CreateEdgeJobViewController,
});
