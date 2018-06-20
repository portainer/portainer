angular.module('portainer.app').component('codeEditor', {
  templateUrl: 'app/portainer/components/code-editor/codeEditor.html',
  controller: 'CodeEditorController',
  bindings: {
    identifier: '@',
    placeholder: '@',
    yml: '<',
    readOnly: '<',
    onChange: '<',
    value: '<'
  }
});
