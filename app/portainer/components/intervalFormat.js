angular.module('portainer.app').directive('intervalformat', function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function ($scope, $element, $attrs, ngModel) {
      ngModel.$validators.invalidIntervalFormat = function (modelValue) {
        try {
          const number = modelValue.substring(0, modelValue.length - 1);
          const unit = modelValue.substring(modelValue.length - 1);
          if (!isNaN(number) && !isNaN(parseFloat(number)) && 'mhdw'.includes(unit)) {
            return true;
          }
          return false;
        } catch (error) {
          return false;
        }
      };

      ngModel.$validators.minimumInterval = function (modelValue) {
        try {
          const number = modelValue.substring(0, modelValue.length - 1);
          const unit = modelValue.substring(modelValue.length - 1);
          let base = 1;
          switch (unit) {
            case 'h':
              base = 60;
              break;
            case 'd':
              base = 1440;
              break;
            case 'w':
              base = 10080;
              break;
          }
          return number * base >= 1 ? true : false;
        } catch (error) {
          return false;
        }
      };
    },
  };
});
