angular.module('portainer.docker').component('volumeStoridgeInfo', {
  templateUrl: 'app/extensions/storidge/components/volume-storidge-info/volumeStoridgeInfo.html',
  controller: 'VolumeStoridgeInfoController',
  bindings: {
    volume: '<'
  }
});
