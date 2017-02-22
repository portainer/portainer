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
          className: options.buttons.confirm.className
        },
        cancel: {
          label: options.buttons.cancel && options.buttons.cancel.label ? options.buttons.cancel.label : 'Cancel'
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

  service.confirmOwnershipChange = function(callback) {
    service.confirm({
      title: 'Are you sure ?',
      message: 'You can change the ownership of an object one way only. You will not be able to make this object private again.',
      buttons: {
        confirm: {
          label: 'Change ownership',
          className: 'btn-primary'
        }
      },
      callback: callback,
    });
  };

  service.confirmImageForceRemoval = function(callback) {
    service.confirm({
      title: "Are you sure?",
      message: "Forcing the removal of the image will remove the image even if it has multiple tags or if it is used by stopped containers.",
      buttons: {
        confirm: {
          label: 'Remove the image',
          className: 'btn-danger'
        }
      },
      callback: callback,
    });
  };

  service.confirmDeletion = function(message, callback) {
    service.confirm({
      title: 'Are you sure ?',
      message: message,
      buttons: {
        confirm: {
          label: 'Delete',
          className: 'btn-danger'
        }
      },
      callback: callback,
    });
  };
  return service;
}]);
