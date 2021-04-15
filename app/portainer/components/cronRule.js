import { parseCronExpression } from 'cron-schedule';

angular.module('portainer.app').directive('cronrule', function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function ($scope, $element, $attrs, ngModel) {
      ngModel.$validators.invalidCron = function (modelValue) {
        try {
          parseCronExpression(modelValue);
          return true;
        } catch (error) {
          return false;
        }
      };
    },
  };
});
