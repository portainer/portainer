angular.module('portainer.services')
.factory('ModalService', [function ModalServiceFactory() {
  'use strict';
  var service = {};
  service.confirm = function(options){
    var box = bootbox.confirm({
      title: options.title,
      message: options.message,
      buttons: {
        confirm: {
          label: options.buttons.confirm.label,
          className: 'btn-danger'
        },
         cancel: {
          label: options.buttons.cancel.label
         }
      },
      callback: options.callback
    });
    box.css({
      'top': '50%',
      'margin-top': function () {
        return -(box.height() / 2);
      }
    });
  };
  return service;
}]);
