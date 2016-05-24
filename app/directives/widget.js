/**
 * Widget Directive
 */

angular
    .module('uifordocker')
    .directive('rdWidget', rdWidget);

function rdWidget() {
    var directive = {
        scope: {
          "ngModel": "="
        },
        transclude: true,
        template: '<div class="widget" ng-transclude></div>',
        restrict: 'EA'
    };
    return directive;

    function link(scope, element, attrs) {
        /* */
    }
}
