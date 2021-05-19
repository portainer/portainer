export const fileUploadForm = {
  templateUrl: './file-upload-form.html',

  bindings: {
    file: '<',
    onChange: '<',
  },

  transclude: {
    description: '?fileUploadDescription',
  },
};
