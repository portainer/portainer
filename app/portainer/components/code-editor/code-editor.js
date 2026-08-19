import controller from './code-editor.controller';

angular.module('portainer.app').component('codeEditor', {
  templateUrl: './code-editor.html',
  controller,
  bindings: {
    identifier: '@',
    textTip: '@',
    yml: '<',
    dockerFile: '<',
    shell: '<',
    readOnly: '<',
    onChange: '<',
    value: '<',
    height: '@',
    schema: '<',
  },
});
