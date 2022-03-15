import bootbox from 'bootbox';

angular.module('portainer.app').factory('ModalService', [
  '$sanitize',
  function ModalServiceFactory($sanitize) {
    'use strict';
    var service = {};

    var applyBoxCSS = function (box) {
      box.css({
        top: '50%',
        'margin-top': function () {
          return -(box.height() / 2);
        },
      });
    };

    var confirmButtons = function (options) {
      var buttons = {
        confirm: {
          label: $sanitize(options.buttons.confirm.label),
          className: $sanitize(options.buttons.confirm.className),
        },
        cancel: {
          label: options.buttons.cancel && options.buttons.cancel.label ? $sanitize(options.buttons.cancel.label) : 'Cancel',
        },
      };
      return buttons;
    };

    service.enlargeImage = function (image) {
      image = $sanitize(image);
      bootbox.dialog({
        message: '<img src="' + image + '" style="width:100%" />',
        className: 'image-zoom-modal',
        onEscape: true,
      });
    };

    service.confirm = function (options) {
      var box = bootbox.confirm({
        title: options.title,
        message: options.message,
        buttons: confirmButtons(options),
        callback: options.callback,
      });
      applyBoxCSS(box);
    };

    function prompt(options) {
      var box = bootbox.prompt({
        title: options.title,
        inputType: options.inputType,
        inputOptions: options.inputOptions,
        buttons: confirmButtons(options),
        callback: options.callback,
      });
      applyBoxCSS(box);
    }

    function customPrompt(options, optionToggled) {
      var box = bootbox.prompt({
        title: options.title,
        inputType: options.inputType,
        inputOptions: options.inputOptions,
        buttons: confirmButtons(options),
        callback: options.callback,
      });
      applyBoxCSS(box);
      box.find('.bootbox-body').prepend('<p>' + options.message + '</p>');
      box.find('.bootbox-input-checkbox').prop('checked', optionToggled);
    }

    service.confirmAccessControlUpdate = function (callback) {
      service.confirm({
        title: 'Are you sure ?',
        message: 'Changing the ownership of this resource will potentially restrict its management to some users.',
        buttons: {
          confirm: {
            label: 'Change ownership',
            className: 'btn-primary',
          },
        },
        callback: callback,
      });
    };

    service.confirmImageForceRemoval = function (callback) {
      service.confirm({
        title: 'Are you sure?',
        message: 'Forcing the removal of the image will remove the image even if it has multiple tags or if it is used by stopped containers.',
        buttons: {
          confirm: {
            label: 'Remove the image',
            className: 'btn-danger',
          },
        },
        callback: callback,
      });
    };

    service.cancelRegistryRepositoryAction = function (callback) {
      service.confirm({
        title: 'Are you sure?',
        message: 'WARNING: interrupting this operation before it has finished will result in the loss of all tags. Are you sure you want to do this?',
        buttons: {
          confirm: {
            label: 'Stop',
            className: 'btn-danger',
          },
        },
        callback: callback,
      });
    };

    service.confirmDeletion = function (message, callback) {
      message = $sanitize(message);
      service.confirm({
        title: 'Are you sure ?',
        message: message,
        buttons: {
          confirm: {
            label: 'Remove',
            className: 'btn-danger',
          },
        },
        callback: callback,
      });
    };

    service.confirmContainerDeletion = function (title, callback) {
      prompt({
        title: title,
        inputType: 'checkbox',
        inputOptions: [
          {
            text: 'Automatically remove non-persistent volumes<i></i>',
            value: '1',
          },
        ],
        buttons: {
          confirm: {
            label: 'Remove',
            className: 'btn-danger',
          },
        },
        callback: callback,
      });
    };

    service.confirmContainerRecreation = function (callback) {
      customPrompt(
        {
          title: 'Are you sure?',
          message:
            "You're about to re-create this container, any non-persisted data will be lost. This container will be removed and another one will be created using the same configuration.",
          inputType: 'checkbox',
          inputOptions: [
            {
              text: 'Pull latest image<i></i>',
              value: '1',
            },
          ],
          buttons: {
            confirm: {
              label: 'Recreate',
              className: 'btn-danger',
            },
          },
          callback: callback,
        },
        false
      );
    };

    service.confirmEndpointSnapshot = function (callback) {
      service.confirm({
        title: 'Are you sure?',
        message: 'Triggering a manual refresh will poll each endpoint to retrieve its information, this may take a few moments.',
        buttons: {
          confirm: {
            label: 'Continue',
            className: 'btn-primary',
          },
        },
        callback: callback,
      });
    };

    service.confirmImageExport = function (callback) {
      service.confirm({
        title: 'Caution',
        message: 'The export may take several minutes, do not navigate away whilst the export is in progress.',
        buttons: {
          confirm: {
            label: 'Continue',
            className: 'btn-primary',
          },
        },
        callback: callback,
      });
    };

    service.confirmServiceForceUpdate = function (message, callback) {
      customPrompt(
        {
          title: 'Are you sure ?',
          message: message,
          inputType: 'checkbox',
          inputOptions: [
            {
              text: 'Pull latest image version<i></i>',
              value: '1',
            },
          ],
          buttons: {
            confirm: {
              label: 'Update',
              className: 'btn-primary',
            },
          },
          callback: callback,
        },
        false
      );
    };

    service.upgradeNotification = function () {
      bootbox.dialog({
        size: 'extra-large',
        title: 'Upgrade notification',
        message: `You are currently using version 1.x of Portainer, which is no longer supported maintained or enhanced. Continuing to use this version is at your own risk.
        <br/><br/>Please upgrade immediately by using the tag <code>portainer/portainer-ce:2.0.1</code>
        <br/><br/>If you decide to stay on version 1, please use the tag <code>portainer/portainer:1.24.2</code> to prevent automatically upgrading to version 2, as <code>portainer:latest</code> will be updated to version 2 from May.`,
        onEscape: false,
        buttons: {
          Close: {
            label: 'Close',
            className: 'btn-primary',
          },
        },
      });
    };

    return service;
  },
]);
