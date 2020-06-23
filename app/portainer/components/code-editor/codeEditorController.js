angular.module('portainer.app').controller('CodeEditorController', function CodeEditorController($document, CodeMirrorService, $scope) {
  var ctrl = this;

  this.$onInit = function () {
    $document.ready(function () {
      var editorElement = $document[0].getElementById(ctrl.identifier);
      ctrl.editor = CodeMirrorService.applyCodeMirrorOnElement(editorElement, ctrl.yml, ctrl.readOnly);
      if (ctrl.onChange) {
        ctrl.editor.on('change', (...args) => $scope.$apply(() => ctrl.onChange(...args)));
      }
      if (ctrl.value) {
        ctrl.editor.setValue(ctrl.value);
      }
    });
  };
});
