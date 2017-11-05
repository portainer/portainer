angular.module('portainer.services')
.factory('CodeMirrorService', function CodeMirrorService() {
  'use strict';

  var codeMirrorGenericOptions = {
    lineNumbers: true
  };

  var codeMirrorYAMLOptions = {
    mode: 'text/x-yaml',
    gutters: ['CodeMirror-lint-markers'],
    lint: true
  };

  var service = {};

  service.applyCodeMirrorOnElement = function(element, yamlLint) {
    var options = codeMirrorGenericOptions;
    if (yamlLint) {
      options = codeMirrorYAMLOptions;
    }
    var cm = CodeMirror.fromTextArea(element, options);
    cm.setSize('100%', 500);
    return cm;
  };

  return service;
});
