import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { TagSelector } from '@/react/components/TagSelector';
import { Loading } from '@/react/components/Widget/Loading';
import { PasswordCheckHint } from '@/react/components/PasswordCheckHint';
import { ViewLoading } from '@/react/components/ViewLoading';

import { fileUploadField } from './file-upload-field';
import { switchField } from './switch-field';
import { customTemplatesModule } from './custom-templates';

export const componentsModule = angular
  .module('portainer.app.react.components', [customTemplatesModule])
  .component(
    'tagSelector',
    r2a(TagSelector, ['allowCreate', 'onChange', 'value'])
  )
  .component('fileUploadField', fileUploadField)
  .component('porSwitchField', switchField)
  .component(
    'passwordCheckHint',
    r2a(PasswordCheckHint, ['passwordValid', 'forceChangePassword'])
  )
  .component('rdLoading', r2a(Loading, []))
  .component('viewLoading', r2a(ViewLoading, ['message'])).name;
