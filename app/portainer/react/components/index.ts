import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { Icon } from '@/react/components/Icon';
import { ReactQueryDevtoolsWrapper } from '@/react/components/ReactQueryDevtoolsWrapper';

import { PageHeader } from '@@/PageHeader';
import { TagSelector } from '@@/TagSelector';
import { Loading } from '@@/Widget/Loading';
import { PasswordCheckHint } from '@@/PasswordCheckHint';
import { ViewLoading } from '@@/ViewLoading';

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
    r2a(PasswordCheckHint, ['forceChangePassword', 'passwordValid'])
  )
  .component('rdLoading', r2a(Loading, []))
  .component('viewLoading', r2a(ViewLoading, ['message']))
  .component(
    'pageHeader',
    r2a(PageHeader, ['title', 'breadcrumbs', 'loading', 'onReload', 'reload'])
  )
  .component('prIcon', r2a(Icon, ['className', 'feather', 'icon']))
  .component('reactQueryDevTools', r2a(ReactQueryDevtoolsWrapper, [])).name;
