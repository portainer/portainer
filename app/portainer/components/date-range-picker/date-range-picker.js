import _ from 'lodash-es';

import { DateRangePickerApi } from './date-range-picker-api';

const AVAILABLE_OPTIONS = [
  'minDate',
  'maxDate',
  'dateLimit',
  'showDropdowns',
  'showWeekNumbers',
  'showISOWeekNumbers',
  'timePicker',
  'timePickerIncrement',
  'timePicker24Hour',
  'timePickerSeconds',
  'ranges',
  'showCustomRangeLabel',
  'alwaysShowCalendars',
  'opens',
  'drops',
  'buttonClasses',
  'applyClass',
  'cancelClass',
  'locale',
  'singleDatePicker',
  'autoApply',
  'linkedCalendars',
  'isInvalidDate',
  'isCustomDate',
  'autoUpdateInput',
  'parentEl',
];

/* @ngInject */
export function dateRangePicker() {
  return {
    restrict: 'E',
    scope: {
      dateRangePickerOptions: '=',
      startDate: '<', //unix timestamp
      endDate: '<?', //unix timestamp
      ngRequired: '<',
      minDate: '<?', //unix timestamp
      maxDate: '<?', //unix timestamp
      clearOnCancel: '@',
      className: '@',
      id: '@',
      onChange: '<',
    },
    templateUrl: './date-range-picker.html',
    require: '?^^form',
    compile: function compile() {
      return function ($scope, $element, $attrs, ctrl) {
        const baseOptions = {
          locale: {
            format: 'YYYY-MM-DD',
          },
        };
        const inputElement = $element.find('input');

        const watchList = ['startDate', 'endDate', 'minDate', 'maxDate'];
        const isDataFound = (baseOptions.singleDatePicker && $scope.startDate) || ($scope.startDate && $scope.endDate);

        let dpApi = undefined;
        let currentApi = undefined;
        let currentApiElement = undefined;
        let destroyListener = undefined;

        $scope.formCtrl = ctrl;
        $scope.dateRangePickerId = `daterange-picker-${_.uniqueId()}`;

        if ($scope.formCtrl && $scope.ngRequired && !$scope.startDate && !$scope.endDate) {
          //initial
          $scope.formCtrl.$setValidity($scope.dateRangePickerId, false);
        }

        if ($scope.dateRangePickerOptions) {
          for (const key in $scope.dateRangePickerOptions) {
            if (AVAILABLE_OPTIONS.indexOf(key) >= 0) {
              baseOptions[key] = $scope.dateRangePickerOptions[key];
            }
          }
        }

        $scope.$on('$destroy', function () {
          currentApiElement.remove();
          currentApi.destroy();
          if (destroyListener) {
            destroyListener();
          }
        });

        function initElement() {
          createElement();
          createController();
          destroyListener = openListener();
        }

        function openListener() {
          return $scope.$watchGroup(watchList, function (n) {
            if (!n || !n.length) {
              return;
            }

            const [startDate, endDate, minDate, maxDate] = n;

            if (minDate) {
              dpApi.setMinDate(minDate);
            }

            if (maxDate) {
              dpApi.setMaxDate(maxDate);
            }

            if (startDate) {
              dpApi.setStartDate(startDate);
            }

            if (endDate) {
              dpApi.setEndDate(endDate);
            }
          });
        }

        function createElement() {
          const tempOptions = angular.copy(baseOptions);
          tempOptions.startDate = $scope.startDate;
          tempOptions.endDate = $scope.endDate;
          currentApiElement = $(inputElement).daterangepicker(tempOptions);

          if (!isDataFound) {
            $(currentApiElement).val('');
          }
        }

        function createController() {
          currentApi = new DateRangePickerApi(currentApiElement, $scope, baseOptions);
          currentApi.init();
          dpApi = currentApi.build();
        }

        initElement();
      };
    },
  };
}
