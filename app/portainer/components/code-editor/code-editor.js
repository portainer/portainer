import controller from './code-editor.controller';

angular.module('portainer.app').component('codeEditor', {
  templateUrl: './code-editor.html',
  controller,
  bindings: {
    identifier: '@',
    placeholder: '@',
    yml: '<',
    readOnly: '<',
    onChange: '<',
    value: '<',
    height: '@',
  },
});
