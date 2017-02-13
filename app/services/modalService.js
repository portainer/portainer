angular.module('portainer.services')
.factory('ModalService', [function ModalServiceFactory() {
  'use strict';
  var service = {};
  service.alert = bootbox.alert;
  service.prompt = bootbox.prompt;
  service.confirm = bootbox.confirm;
  return service;
}]);
