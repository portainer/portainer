import { r2a } from '@/react-tools/react2angular';

import { FileUploadField } from '@@/form-components/FileUpload';

export const fileUploadField = r2a(FileUploadField, [
  'onChange',
  'value',
  'title',
  'required',
  'accept',
  'inputId',
  'data-cy',
  'className',
  'color',
  'name',
  'hideFilename',
  'tooltip',
  'disabled',
  'state',
]);
