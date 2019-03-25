angular.module('portainer.docker').component('volumeStoridgeInfo', {
  templateUrl: './volumeStoridgeInfo.html',
  controller: 'VolumeStoridgeInfoController',
  bindings: {
    volume: '<'
  }
});
