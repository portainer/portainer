import _ from 'lodash-es';

angular.module('portainer.docker')
.controller('porImageRegistryController', ['$q', 'RegistryService', 'DockerHubService', 'ImageService', 'Notifications',
function ($q, RegistryService, DockerHubService, ImageService, Notifications) {
  var ctrl = this;

  function initComponent() {
    $q.all({
      registries: RegistryService.registries(),
      dockerhub: DockerHubService.dockerhub(),
      availableImages: ctrl.autoComplete ? ImageService.images() : []
    })
    .then(function success(data) {
      var dockerhub = data.dockerhub;
      var registries = data.registries;
      ctrl.availableImages = ImageService.getUniqueTagListFromImages(data.availableImages);
      ctrl.availableRegistries = [dockerhub].concat(registries);
      if (!ctrl.registry.Id) {
        ctrl.registry = dockerhub;
      } else {
        ctrl.registry = _.find(ctrl.availableRegistries, { 'Id': ctrl.registry.Id });
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registries');
    });
  }

  initComponent();
}]);
