angular.module('portainer.app').component('codeEditor', {
  templateUrl: './codeEditor.html',
  controller: 'CodeEditorController',
  bindings: {
    identifier: '@',
    placeholder: '@',
    yml: '<',
    readOnly: '<',
    onChange: '<',
    value: '<',
  },
});
