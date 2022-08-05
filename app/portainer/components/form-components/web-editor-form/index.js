import controller from './web-editor-form.controller.js';

export const webEditorForm = {
  templateUrl: './web-editor-form.html',
  controller,

  bindings: {
    identifier: '@',
    placeholder: '@',
    yml: '<',
    value: '<',
    readOnly: '<',
    onChange: '<',
    hideTitle: '<',
  },

  transclude: {
    description: '?editorDescription',
  },
};
