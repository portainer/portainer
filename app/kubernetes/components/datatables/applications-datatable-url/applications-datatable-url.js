import angular from 'angular';
import './applications-datatable-url.css';

angular.module('portainer.kubernetes').component('kubernetesApplicationsDatatableUrl', {
  templateUrl: './applications-datatable-url.html',
  bindings: {
    publishedUrl: '@',
  },
});
