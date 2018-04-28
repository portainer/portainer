angular.module('portainer.app')
.directive('rdWidgetHeader', function rdWidgetTitle() {
  var directive = {
    requires: '^rdWidget',
    scope: {
      title: '@',
      icon: '@',
      classes: '@?',
      toggleFn: '&?',
      toggle: '<?'
    },
    transclude: true,
    template: function(element, attrs) {
      var withToggle = ( attrs.toggle === undefined ) ? { pre:'', post:'' } : {
        pre: '<span class="interactive" ng-click="toggleFn()"><i class="fa fa-angle-double-{{(toggle)?\'up\':\'down\'}}"></i> ',
        post: '</span>'
      };
      return '<div class="widget-header"><div class="row">' +
               '<span ng-class="classes" class="pull-left">' + withToggle.pre + '<i class="fa" ng-class="icon"></i> {{title}} </span>' + withToggle.post +
               '<span ng-class="classes" class="pull-right" ng-transclude></span>' +
             '</div></div>';
    },
    restrict: 'E'
  };
  return directive;
});
