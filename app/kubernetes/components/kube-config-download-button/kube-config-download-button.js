import angular from 'angular';
import controller from './kube-config-download-button.controller';

angular.module('portainer.kubernetes').component('kubeConfigDownloadButton', {
  templateUrl: './kube-config-download-button.html',
  controller,
});
