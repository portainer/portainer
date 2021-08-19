import angular from 'angular';
import './helm-templates-list-item.css';

angular.module('portainer.kubernetes').component('helmTemplatesListItem', {
  templateUrl: './helm-templates-list-item.html',
  bindings: {
    model: '<',
    onSelect: '<',
  },
  transclude: {
    actions: '?templateItemActions',
  },
});
