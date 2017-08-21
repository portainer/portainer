angular.module('portainer.services')
.factory('TranslationService', ['$translate', function TranslationServiceFactory($translate) {
  'use strict';

  var service = {};

  service.setLang = function(lang) {
    moment.locale(lang);
    $translate.use(lang);
  };

  return service;
}]);
