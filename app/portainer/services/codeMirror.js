angular.module('portainer.app')
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

  service.applyCodeMirrorOnElement = function(element, yamlLint, readOnly) {
    var options = codeMirrorGenericOptions;

    if (yamlLint) {
      options = codeMirrorYAMLOptions;
    }

    if (readOnly) {
      options.readOnly = true;
    }

    var cm = CodeMirror.fromTextArea(element, options);
    cm.setSize('100%', 500);
    return cm;
  };

  return service;
});
