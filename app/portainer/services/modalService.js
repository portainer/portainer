angular.module('portainer.app')
.factory('ModalService', [function ModalServiceFactory() {
  'use strict';
  var service = {};

  var applyBoxCSS = function(box) {
    box.css({
      'top': '50%',
      'margin-top': function () {
        return -(box.height() / 2);
      }
    });
  };

  var confirmButtons = function(options) {
    var buttons = {
      confirm: {
        label: options.buttons.confirm.label,
        className: options.buttons.confirm.className
      },
      cancel: {
        label: options.buttons.cancel && options.buttons.cancel.label ? options.buttons.cancel.label : 'Cancel'
      }
    };
    return buttons;
  };

  service.confirm = function(options){
    var box = bootbox.confirm({
      title: options.title,
      message: options.message,
      buttons: confirmButtons(options),
      callback: options.callback
    });
    applyBoxCSS(box);
  };

  service.prompt = function(options){
    var box = bootbox.prompt({
      title: options.title,
      inputType: options.inputType,
      inputOptions: options.inputOptions,
      buttons: confirmButtons(options),
      callback: options.callback
    });
    applyBoxCSS(box);
  };

  service.customPrompt = function(options) {
    var box = bootbox.prompt({
      title: options.title,
      inputType: options.inputType,
      inputOptions: options.inputOptions,
      buttons: confirmButtons(options),
      callback: options.callback
    });
    applyBoxCSS(box);
    box.find('.bootbox-body').prepend('<p>' + options.message + '</p>');
    box.find('.bootbox-input-checkbox').prop('checked', true);
  };

  service.confirmAccessControlUpdate = function(callback, msg) {
    service.confirm({
      title: 'Are you sure ?',
      message: 'Changing the ownership of this resource will potentially restrict its management to some users.',
      buttons: {
        confirm: {
          label: 'Change ownership',
          className: 'btn-primary'
        }
      },
      callback: callback
    });
  };

  service.confirmImageForceRemoval = function(callback) {
    service.confirm({
      title: 'Are you sure?',
      message: 'Forcing the removal of the image will remove the image even if it has multiple tags or if it is used by stopped containers.',
      buttons: {
        confirm: {
          label: 'Remove the image',
          className: 'btn-danger'
        }
      },
      callback: callback
    });
  };

  service.confirmDeletion = function(message, callback) {
    service.confirm({
      title: 'Are you sure ?',
      message: message,
      buttons: {
        confirm: {
          label: 'Remove',
          className: 'btn-danger'
        }
      },
      callback: callback
    });
  };

  service.confirmContainerDeletion = function(title, callback) {
    service.prompt({
      title: title,
      inputType: 'checkbox',
      inputOptions: [
        {
          text: 'Automatically remove non-persistent volumes<i></i>',
          value: '1'
        }
      ],
      buttons: {
        confirm: {
          label: 'Remove',
          className: 'btn-danger'
        }
      },
      callback: callback
    });
  };

  service.confirmContainerRecreation = function(callback) {
    service.customPrompt({
      title: 'Are you sure?',
      message: 'You\'re about to re-create this container, any non-persisted data will be lost. This container will be removed and another one will be created using the same configuration.',
      inputType: 'checkbox',
      inputOptions: [
        {
          text: 'Pull latest image<i></i>',
          value: '1'
        }
      ],
      buttons: {
        confirm: {
          label: 'Recreate',
          className: 'btn-danger'
        }
      },
      callback: callback
    });
  };

  service.confirmExperimentalFeature = function(callback) {
    service.confirm({
      title: 'Experimental feature',
      message: 'This feature is currently experimental, please use with caution.',
      buttons: {
        confirm: {
          label: 'Continue',
          className: 'btn-danger'
        }
      },
      callback: callback
    });
  };

  service.confirmServiceForceUpdate = function(message, callback) {
    service.confirm({
      title: 'Are you sure ?',
      message: message,
      buttons: {
        confirm: {
          label: 'Update',
          className: 'btn-primary'
        }
      },
      callback: callback
    });
  };

  return service;
}]);
