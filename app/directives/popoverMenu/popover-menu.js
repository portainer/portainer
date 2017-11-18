angular
.module('portainer')
.directive('rdPopoverMenu', function rdPopoverMenuFunc() {
  var directive = {
    scope: {
      object: '=',
      tpl: '@',
      refId: '@?'
    },
    template: '<span><a' +
                'class="dropdown-select-label" ' +
                'popover-append-to-body="true" ' +
                'popover-trigger="\'click outsideClick\'" ' +
                'popover-class="popover-no-margin" ' +
                'popover-placement="bottom" ' +
                'uib-popover-template="\'app/directives/popoverMenu/tpl_{{tpl}}.html\'"' +
                'popover-is-open="object.isOpen">' +
                  '<i class="fa fa-{{object.Options[object.Active]}} space-right"></i>{{object.Active}}' +
              '</a></span>',
    restrict: 'E'
  };
  return directive;
});
