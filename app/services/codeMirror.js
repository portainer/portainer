angular.module('portainer.services')
.factory('CodeMirrorService', function CodeMirrorService() {
  'use strict';

  var codeMirrorOptions = {
    lineNumbers: true,
    mode: 'text/x-yaml',
    gutters: ['CodeMirror-lint-markers'],
    lint: true
  };

  var service = {};

  service.applyCodeMirrorOnElement = function(element) {
    var cm = CodeMirror.fromTextArea(element, codeMirrorOptions);
    cm.setSize('100%', 500);
    return cm;
  };

  return service;
});
